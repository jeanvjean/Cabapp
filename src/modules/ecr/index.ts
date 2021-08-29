import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { BranchInterface } from "../../models/branch";
import { CustomerInterface } from "../../models/customer";
import { EcrApproval, EmptyCylinderInterface, Priority, ProductionSchedule } from "../../models/emptyCylinder";
import { OutgoingCylinderInterface } from "../../models/ocn";
import { RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { ApprovalStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { createLog } from "../../util/logs";
import Notify from '../../util/mail';
import { padLeft, passWdCheck } from "../../util/token";
import { mongoose } from "../cylinder";
import Module, { QueryInterface } from "../module";

export interface EmptyCylinderProps{
    emptyCylinder:Model<EmptyCylinderInterface>
    user:Model<UserInterface>
    cylinder:Model<RegisteredCylinderInterface>
    customer:Model<CustomerInterface>
    ocn:Model<OutgoingCylinderInterface>
    branch:Model<BranchInterface>
}

interface ApproveEcrInput {
    ecrId:string
    status:string
    password:string
}

export interface newEcrInterface {
    customer:EmptyCylinderInterface['customer']
    cylinders:EmptyCylinderInterface['cylinders']
    priority?:EmptyCylinderInterface['priority']
    approvalOfficers:EmptyCylinderInterface['approvalOfficers']
    nextApprovalOfficer:EmptyCylinderInterface['nextApprovalOfficer']
    status:EmptyCylinderInterface['status']
    scheduled:EmptyCylinderInterface['scheduled']
    position:EmptyCylinderInterface['position']
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

    public async createECR(data:newEcrInterface, user:UserInterface):Promise<EmptyCylinderInterface|undefined>{
        try {
            const ecr = new this.emptyCylinder({...data,branch:user.branch});
            if(ecr.priority == Priority.URGENT) {
                let aprvO = await this.user.findOne({role:user.role, subrole:"head of department", branch:user.branch});
                if(!aprvO) {
                    throw new BadInputFormatException('can\'t find the HOD cannot create without one');
                }
                ecr.nextApprovalOfficer = aprvO?._id;
                new Notify().push({
                    subject: "Created ECR",
                    content: `An ECR requires your approval please check and review for approval`,
                    user: aprvO
                });
            }
            let avEcr = await this.emptyCylinder.find({}).sort({initNum:-1}).limit(1);
            let init = "ECR"
            let num;
            if(!avEcr[0]) {
                num = 1
            }else {
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
            await ecr.save();
            return Promise.resolve(ecr);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async emptyCylinderPool(query:QueryInterface, user:UserInterface):Promise<EmptyCylinderInterface[]|undefined>{
        try {
            const { search } = query;
            const ObjectId = mongoose.Types.ObjectId;
            const options = {
                ...query
            }
            const aggregate = this.emptyCylinder.aggregate([
                {
                    $match:{
                        $and:[
                            {
                                $or:[
                                    {ecrNo:{
                                        $regex: search?.toLowerCase || ""
                                    }},
                                    {priority:{
                                        $regex: search?.toLowerCase || ""
                                    }},
                                    {ecrNo:{
                                        $regex: search?.toLowerCase || ""
                                    }},
                                    {position:{
                                        $regex: search?.toLowerCase || ""
                                    }}
                                ]
                            },
                            {branch:ObjectId(user.branch.toString())},
                            {scheduled:false}
                        ]
                    }
                },
                {
                    $sort:{priority:1}
                }
            ]);
            //@ts-ignore
            const ecr = await this.emptyCylinder.aggregatePaginate(aggregate, options);
            return Promise.resolve(ecr);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchEcrdetails(ecrId:string):Promise<EmptyCylinderInterface|undefined>{
        try {
            const ecr = await this.emptyCylinder.findById(ecrId);
            return Promise.resolve(ecr as EmptyCylinderInterface);
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
            const { search } = query;
            const ObjectId = mongoose.Types.ObjectId;
            const options = {
                ...query
            }
            let aggregate = this.emptyCylinder.aggregate([
                {
                    $match:{
                        $and:[
                            {
                                $or:[
                                    {ecrNo:{
                                        $regex: search?.toLowerCase || ""
                                    }},
                                    {ecrNo:{
                                        $regex: search?.toLowerCase || ""
                                    }}
                                ]
                            },
                            {branch:ObjectId(user.branch.toString())},
                            {status: EcrApproval.PENDING},
                            {priority: Priority.URGENT}
                        ]
                    }
                },
                {
                    $sort:{createdAt:1}
                }
            ]);
            //@ts-ignore
            const request = await this.emptyCylinder.aggregatePaginate(aggregate, options);
            return Promise.resolve(request);
        } catch (e) {
            this.handleException(e)
        }
    }
}

export default EmptyCylinderModule;