import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { BranchInterface } from "../../models/branch";
import { CustomerInterface } from "../../models/customer";
import { EcrApproval, EcrType, EmptyCylinderInterface, Priority, ProductionSchedule } from "../../models/emptyCylinder";
import { OutgoingCylinderInterface } from "../../models/ocn";
import { RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { UserInterface } from "../../models/user";
import { WalkinCustomerStatus } from "../../models/walk-in-customers";
import { createLog } from "../../util/logs";
import Notify from '../../util/mail';
import { padLeft, passWdCheck } from "../../util/token";
import { mongoose } from "../cylinder";
import Module, { QueryInterface } from "../module";
import env from '../../configs/static';

export interface EmptyCylinderProps{
    emptyCylinder:Model<EmptyCylinderInterface>
    user:Model<UserInterface>
    cylinder:Model<RegisteredCylinderInterface>
    customer:Model<CustomerInterface>
    ocn:Model<OutgoingCylinderInterface>
    branch:Model<BranchInterface>
}

interface tecrApprovalInput {
    tecrId:string,
    otp:string
}

interface ApproveEcrInput {
    ecrId:string
    status:string
    password:string
}

export interface newEcrInterface {
    customer:EmptyCylinderInterface['customer']
    cylinders?:EmptyCylinderInterface['cylinders']
    fringeCylinders?:EmptyCylinderInterface['fringeCylinders']
    priority?:EmptyCylinderInterface['priority'],
    type:EmptyCylinderInterface['type'],
    gasType:EmptyCylinderInterface['gasType'],
    icn_id?:EmptyCylinderInterface['icn_id']
}

type skipped = {
    cyliderNumebr: string,
    assignedNumber:string,
    barcode:string
}

type createEcrResponse = {
    ecr: EmptyCylinderInterface,
    missed_cyinders:skipped[],
    message:string
}

class EmptyCylinderModule extends Module {
    private emptyCylinder:Model<EmptyCylinderInterface>
    private user:Model<UserInterface>
    private cylinder:Model<RegisteredCylinderInterface>
    private customer:Model<CustomerInterface>
    private ocn:Model<OutgoingCylinderInterface>
    private branch:Model<BranchInterface>


    constructor(props:EmptyCylinderProps) {
        super()
        this.emptyCylinder = props.emptyCylinder;
        this.user = props.user;
        this.ocn = props.ocn;
        this.cylinder = props.cylinder;
        this.customer = props.customer;
        this.branch = props.branch
    }

    public async createECR(data:newEcrInterface, user:UserInterface):Promise<createEcrResponse|undefined>{
        try {
            let not_same = []
            const ecr = new this.emptyCylinder({
                ...data,
                branch:user.branch
            });
            let aprvO = await this.user.findOne({role:user.role, subrole:"head of department", branch:user.branch});
            if(!aprvO) {
                throw new BadInputFormatException('can\'t find the HOD cannot create without one');
            }
            if(data.customer) {
                let cust = await this.customer.findById(data.customer);
                if(!cust) {
                    throw new BadInputFormatException('no customer found with this id. pass a valid customer id')
                }
            }
            ecr.nextApprovalOfficer = aprvO?._id;
            if(ecr.priority == Priority.URGENT) {
                new Notify().push({
                    subject: "Created ECR Priority",
                    content: `An ECR requires your URGENT! approval please check and review for approval ${env.FRONTEND_URL}/ecr/ecr-details/${ecr._id}`,
                    user: aprvO
                });
            }
            if(ecr.priority == Priority.REGULAR) {
                new Notify().push({
                    subject: "Created ECR",
                    content: `An ECR requires your approval please check and review for approval ${env.FRONTEND_URL}/ecr/ecr-details/${ecr._id}`,
                    user: aprvO
                });
            }
            let added = []
            if(ecr.cylinders.length > 0) {
                for(let cyl of ecr.cylinders) {
                    let c = await this.cylinder.findById(cyl);
                    if(c) {
                        if(c.gasType == data.gasType) {
                            //@ts-ignore
                            c.cylinderStatus = WalkinCustomerStatus.EMPTY;
                            c.assignedTo = data.customer;
                            added.push(cyl);
                            await c.save();
                        }else {
                            not_same.push({
                                cyliderNumebr: c.cylinderNumber,
                                assignedNumber:c.assignedNumber,
                                barcode:c.barcode
                            });
                        }
                    }
                    
                }
            }
            ecr.cylinders = added;
            let avEcr = await this.emptyCylinder.find({}).sort({initNum:-1}).limit(1);
            let init = "SECR"
            let num;
            if(!avEcr[0]) {
                num = 1
            }else {
                //@ts-ignore
                num = avEcr[0].initNum +1;
            }
            let inNum =  padLeft(num, 6, "");
            ecr.ecrNo = init+inNum;
            ecr.initNum = num;
            await createLog({
                user:user._id,
                activities:{
                  title:'ECR created',
                  activity:`Created an ECR`,
                  time: new Date().toISOString()
                }
            });
            let message = not_same.length > 0 ? 'ecr created !! some cylinders do not match the gas type' : 'ecr created'
            let fIcn = await this.ocn.findById(ecr.icn_id);
            if(!fIcn) {
                throw new BadInputFormatException('an icn with this id was not found')
            }
            let totalIcnCylinders = fIcn.totalCylinders;
            let ecrtotalcyl = ecr.cylinders.length;
            fIcn.totalCylinders = totalIcnCylinders - +ecrtotalcyl

            await fIcn.save()
            await ecr.save();
            return Promise.resolve({
                ecr,
                missed_cyinders:not_same,
                message
            });
        } catch (e) {
            this.handleException(e)
        }
    }

    public async emptyCylinderPool(query:QueryInterface, user:UserInterface):Promise<EmptyCylinderInterface[]|undefined>{
        try {
            const { search, type, page, limit } = query;
            const ObjectId = mongoose.Types.ObjectId;
            const options = {
                page:page || 1,
                limit:limit || 10,
                sort:{priority: 1},
                populate:[
                    {path:'cylinders', model:'registered-cylinders'},
                    {path:'customer', model:'customer'},
                    {path:'nextApprovalOfficer', model:'User'},
                    {path:'initiator', model:'User'},
                    {path:'branch', model:'branches'},
                    {path:"gasType", model:"cylinder"},
                    {path:"icn_id", model:"out-going-cylinders"}
                ]
            }
            let q = {
                branch:user.branch,
                type: EcrType.SALES,
                closed:false
            }
            let or =[]
            if(search) {
                or.push({status:new RegExp(search, 'gi')});
                or.push({ecrNo: new RegExp(search, 'gi')})
            }
            if(type) {
                //@ts-ignore
                q = {...q, type:type}
            }
            if(or.length > 0) {
                //@ts-ignore
                q = {...q, $or:or}
            }
            //@ts-ignore
            const ecr = await this.emptyCylinder.paginate(q, options);
            return Promise.resolve(ecr);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async complaintEcr(query:QueryInterface, user:UserInterface):Promise<EmptyCylinderInterface[]|undefined>{
        try {
            const { search, type, page, limit } = query;
            const ObjectId = mongoose.Types.ObjectId;
            const options = {
                page:page || 1,
                limit:limit || 10,
                populate:[
                    {path:'cylinders', model:'registered-cylinders'},
                    {path:'customer', model:'customer'},
                    {path:'nextApprovalOfficer', model:'User'},
                    {path:'initiator', model:'User'},
                    {path:'branch', model:'branches'},
                    {path:"gasType", model:"cylinder"},
                    {path:"icn_id", model:"out-going-cylinders"}
                ],
                sort:{priority: 1}
            }
            let q = {
                branch:user.branch,
                type:EcrType.COMPLAINT,
                closed:false
            }
            let or =[]
            if(search) {
                or.push({status:new RegExp(search, 'gi')});
                or.push({ecrNo: new RegExp(search, 'gi')})
            }
            if(type) {
                //@ts-ignore
                q = {...q, type:type}
            }
            if(or.length > 0) {
                //@ts-ignore
                q = {...q, $or:or}
            }
            //@ts-ignore
            const ecr = await this.emptyCylinder.paginate(q, options);
            return Promise.resolve(ecr);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchEcrdetails(ecrId:string):Promise<EmptyCylinderInterface|undefined>{
        try {
            const ecr = await this.emptyCylinder.findById(ecrId).populate([
                {path:'cylinders', model:'registered-cylinders'},
                {path:'customer', model:'customer'},
                {path:'nextApprovalOfficer', model:'User'},
                {path:'initiator', model:'User'},
                {path:'branch', model:'branches'},
                {path:"gasType", model:"cylinder"},
                {path:"icn_id", model:"out-going-cylinders"}
            ]);
            return Promise.resolve(ecr as EmptyCylinderInterface);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchTECR(query:QueryInterface, user:UserInterface):Promise<EmptyCylinderInterface[]|undefined>{
        try {
            let { ecr, customer, type, driverStatus, salesStatus, search } = query;
            let q = {
                branch:user.branch,
                type:EcrType.TRUCK
            }
            let options = {
                page:query.page || 1,
                limit:query.limit || 10,
                populate:[
                    {path:'customer', model:'customer'},
                    {path:'cylinders', model:'registered-cylinders'},
                    {path:'nextApprovalOfficer', model:'User'},
                    {path:'branch', model:'branches'},
                    {path:'initiator', model:'User'},
                    {path:"gasType", model:"cylinder"},
                    {path:"icn_id", model:"out-going-cylinders"}
                ],
                sort:{priority: 1}
            }
            let or = []

            if(ecr) {
                // or.push({tecrNo: new RegExp(tecr, 'gi')})
                //@ts-ignore
                q = {...q, tecrNo: new RegExp(ecr, 'gi')}
            }
            if(customer) {
                // or.push({"customer.name": new RegExp(customer, 'gi')})
                //@ts-ignore
                q = {...q, "customer.name": new RegExp(customer, 'gi')}
            }

            if(type) {
                //@ts-ignore
                q = {...q, type:new RegExp(type, 'gi')}
            }
            if(driverStatus) {
                //@ts-ignore
                q = {...q, driverStatus:new RegExp(driverStatus, 'gi')}
            }
            if(salesStatus) {
                //@ts-ignore
                q = {...q, status:new RegExp(salesStatus, 'gi')}
            }
            if(search) {
                or.push({tecrNo: new RegExp(search, 'gi')})
            }
            if(or.length > 0) {
                //@ts-ignore
                q = {...q, $or:or}
            }
            //@ts-ignore
            const empty = await this.emptyCylinder.paginate(q, options);
            return Promise.resolve(empty);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchFCR(query:QueryInterface, user:UserInterface):Promise<EmptyCylinderInterface[]|undefined>{
        try {
            let { ecr, customer, type, driverStatus, salesStatus, search } = query;
            let q = {
                branch:user.branch,
                type:EcrType.FILLED,
                closed:false
            }
            let options = {
                page:query.page || 1,
                limit:query.limit || 10,
                populate:[
                    {path:'customer', model:'customer'},
                    {path:'cylinders', model:'registered-cylinders'},
                    {path:'nextApprovalOfficer', model:'User'},
                    {path:'branch', model:'branches'},
                    {path:'initiator', model:'User'},
                    {path:"gasType", model:"cylinder"},
                    {path:"icn_id", model:"out-going-cylinders"}
                ],
                sort:{priority: 1}
            }
            let or = []

            if(ecr) {
                // or.push({tecrNo: new RegExp(tecr, 'gi')})
                //@ts-ignore
                q = {...q, tecrNo: new RegExp(ecr, 'gi')}
            }
            if(customer) {
                // or.push({"customer.name": new RegExp(customer, 'gi')})
                //@ts-ignore
                q = {...q, "customer.name": new RegExp(customer, 'gi')}
            }

            if(type) {
                //@ts-ignore
                q = {...q, type:new RegExp(type, 'gi')}
            }
            if(driverStatus) {
                //@ts-ignore
                q = {...q, driverStatus:new RegExp(driverStatus, 'gi')}
            }
            if(salesStatus) {
                //@ts-ignore
                q = {...q, status:new RegExp(salesStatus, 'gi')}
            }
            if(search) {
                or.push({tecrNo: new RegExp(search, 'gi')})
            }
            if(or.length > 0) {
                //@ts-ignore
                q = {...q, $or:or}
            }
            //@ts-ignore
            const empty = await this.emptyCylinder.paginate(q, options);
            return Promise.resolve(empty);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchTEcrDetails(tecrNo:string):Promise<EmptyCylinderInterface|undefined>{
        try {
            const data = await this.emptyCylinder.findOne({tecrNo:tecrNo}).populate([
                {path:'cylinders', model:'registered-cylinders'},
                {path:'customer', model:'customer'},
                {path:'nextApprovalOfficer', model:'User'},
                {path:'initiator', model:'User'},
                {path:'branch', model:'branches'},
                {path:"gasType", model:"cylinder"},
                {path:"icn_id", model:"out-going-cylinders"}
            ]);
            return Promise.resolve(data as EmptyCylinderInterface);
        } catch (e) {
            this.handleException(e)
        }
    }
    //@ts-ignore
    public async completeTecr(input:tecrApprovalInput, user:UserInterface):Promise<EmptyCylinderInterface|undefined>{
        try {
            let { tecrId, otp } = input;
            let data = await this.emptyCylinder.findById(tecrId);
            if(!data) {
                throw new BadInputFormatException('sorry this request was not found');
            }
            if(data.otp !== otp) {
                throw new BadInputFormatException('invalid otp provided');
            }
            data.driverStatus = EcrApproval.APPROVED;            
            await data.save();
            let notifyUser = await this.user.findOne({role:'security', subrole:"head of department"});
            await new Notify().push({
                subject: "New TECR",
                content: `A truck ECR has been registered by ${user.name}, click the link to view: ${env.FRONTEND_URL}/tecr-details/${data.ecrNo}`,
                user: notifyUser
            })
            return Promise.resolve(data);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async approveEcr(data:ApproveEcrInput, user:UserInterface):Promise<EmptyCylinderInterface|undefined>{
        try {
            let pwCheck = await passWdCheck(user, data.password);
            let { ecrId, status } = data;
            const request = await this.emptyCylinder.findById(ecrId);
            if(data.status == EcrApproval.APPROVED) {
                //@ts-ignore
                request?.status = EcrApproval.APPROVED;
                //@ts-ignore
                request?.position = ProductionSchedule.NEXT;
            }else {
                //@ts-ignore
                request?.status = EcrApproval.REJECTED;
            }
            let init = await this.user.findById(request?.initiator);
            
            new Notify().push({
                subject: "ECR Approved",
                content: `An ECR approval you requested has been ${request?.status}`,
                user: init
            });
            await createLog({
                user:user._id,
                activities:{
                  title:'Approved ECR',
                  activity:`You approved an ecr`,
                  time: new Date().toISOString()
                }
            });
            await request?.save();
            return Promise.resolve(request as EmptyCylinderInterface);
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchPendingApprovals(query:QueryInterface, user:UserInterface):Promise<EmptyCylinderInterface|undefined>{
        try {
            const { search,page,limit, type } = query;
            const ObjectId = mongoose.Types.ObjectId;
            const options = {
                page:page||1,
                limit:limit||10,
                sort:{priority: Priority.URGENT}
            }
            let q = {
                branch:user.branch,
                status: EcrApproval.PENDING,
            }
            let or = []
            if(search){
                or.push({ecrNo: new RegExp(search, 'gi')})
            }
            if(type) {
                //@ts-ignore
                q = {...q, type:type}
            }
            if(or.length>0){
                //@ts-ignore
                q = {...q, $or:or}
            }            
            //@ts-ignore
            const request = await this.emptyCylinder.paginate(q, options);
            return Promise.resolve(request);
        } catch (e) {
            this.handleException(e)
        }
    }
}

export default EmptyCylinderModule;