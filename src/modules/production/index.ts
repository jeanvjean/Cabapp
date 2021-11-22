import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ProductionScheduleInterface } from "../../models/productionSchedule";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";
import env from '../../configs/static';
import Notify from '../../util/mail';
import { createLog } from "../../util/logs";
import { padLeft, passWdCheck } from "../../util/token";
import { RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { WalkinCustomerStatus } from "../../models/walk-in-customers";
import { EmptyCylinderInterface } from "../../models/emptyCylinder";

interface productionModuleProps {
  production:Model<ProductionScheduleInterface>,
  user:Model<UserInterface>
  regCylinder:Model<RegisteredCylinderInterface>
  ecr:Model<EmptyCylinderInterface>
}

interface newProductionInterface{
  customer:ProductionScheduleInterface['customer']
  productionNo:ProductionScheduleInterface['productionNo']
  ecrNo:ProductionScheduleInterface['ecrNo']
  shift:ProductionScheduleInterface['shift']
  priority?:ProductionScheduleInterface['priority']
  date:ProductionScheduleInterface['date']
  cylinders:ProductionScheduleInterface['cylinders']
  quantityToFill:ProductionScheduleInterface['quantityToFill']
  volumeToFill:ProductionScheduleInterface['volumeToFill']
  totalQuantity:ProductionScheduleInterface['totalQuantity']
  totalVolume:ProductionScheduleInterface['totalQuantity']
  comment:string
  ecr?:ProductionScheduleInterface['ecr']
}

interface ProductionApprovalInput{
  comment:string
  status:string,
  productionId:string,
  nextApprovalOfficer?:string,
  password:string
}

interface UpdateProduction {
  productionId:string
  cylinders:ProductionScheduleInterface['cylinders']
}


class ProductionSchedule extends Module{
  private production:Model<ProductionScheduleInterface>
  private user:Model<UserInterface>
  private regCylinder:Model<RegisteredCylinderInterface>
  private ecr:Model<EmptyCylinderInterface>

  constructor(props:productionModuleProps){
    super()
    this.production = props.production
    this.user = props.user
    this.regCylinder = props.regCylinder
    this.ecr = props.ecr
  }

  public async createProductionSchedule(data:newProductionInterface, user:UserInterface):Promise<ProductionScheduleInterface|undefined>{
    try {
      const production = new this.production(data);
      production.initiator = user._id;
      production.approvalStage = stagesOfApproval.STAGE1
      let hod = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.branch});
      production.nextApprovalOfficer = hod?._id;
      production.branch = user.branch;
      production.approvalOfficers.push({
        name:user.name,
        id:user._id,
        office:user.subrole,
        department:user.role,
        stageOfApproval:stagesOfApproval.STAGE1
      });

      let sche = await this.production.find({}).sort({initNum:-1}).limit(1);
      let sn;
      if(sche[0]) {
        sn = sche[0].initNum + 1
      }else {
        sn = 1
      }
      let num = padLeft(sn, 6, '');
      production.productionNo = "PN"+num;
      production.initNum = sn;
      production.comments.push({
        comment:data.comment,
        commentBy:user._id
      });

      /**remove cylinders from ecr */
      let fEcr = await this.ecr.findById(production.ecr);
      if(!fEcr) {
        throw new BadInputFormatException('ecr id not found');
      }
      let removeArr = [];
      let remain = []
      for(let cyl of production.cylinders){
        let cylinder = await this.regCylinder.findById(cyl)
        if(!cylinder) {
          throw new BadInputFormatException(`cylinder with this id does not seem to be found`)
        }
        if(!fEcr.cylinders.includes(cylinder._id)) {
          throw new BadInputFormatException(`cylinder with this id does not seem to be found on the ECR`)
        }
        if(fEcr.cylinders.includes(cylinder._id)){
          removeArr.push(cylinder._id)
        }
      }
      for(let cyl of fEcr.cylinders) {
        if(!removeArr.includes(cyl)){
          remain.push(cyl)
        }
      }
      if(fEcr.cylinders.length <= 0) {
        fEcr.closed = true
      }

      fEcr.cylinders = remain;
      await fEcr.save();

      /** remove cylinders from ecr*/
      await production.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Production Schedule',
          //@ts-ignore
          activity:`You Created a new production schedule`,
          time: new Date().toISOString()
        }
      });
      let approvalUser = await this.user.findById(production.nextApprovalOfficer);
      new Notify().push({
        subject: "Production Schedule",
        content: `A production has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
        user: approvalUser
      });
      return Promise.resolve(production);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveProductionSchedule(data:ProductionApprovalInput, user:UserInterface):Promise<ProductionScheduleInterface|undefined>{
    try {
      await passWdCheck(user, data.password)
      const production = await this.production.findById(data.productionId).populate([
        {path:'initiator', model:'User'}
      ]);
      if(!production) {
        throw new BadInputFormatException('production schedule not found');
      }
      if(data.status == ApprovalStatus.REJECTED) {
        if(production?.approvalStage == stagesOfApproval.STAGE1){
          let AO = production.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          let checkOfficer = production.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            production.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          // production.tracking.push(track)
          production.approvalStage = stagesOfApproval.START
          production.nextApprovalOfficer = AO[0].id
          production.comments.push({
            comment:data.comment,
            commentBy:user._id,
            officer:'Authorizing officer'
          });
          await production.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Production Schedule',
              //@ts-ignore
              activity:`You rejected a production Schedule approval request made by ${production.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          await new Notify().push({
            subject: "Production Schedule",
            content: `A production schedule You initiated failed approval please attend to the corrections. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
            user: approvalUser
          });
          return Promise.resolve(production);
        }else if(production?.approvalStage == stagesOfApproval.STAGE2) {
          let AO = production.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
         
          let checkOfficer = production.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            production.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          // transfer.tracking.push(track);
          production.approvalStage = stagesOfApproval.STAGE1
          production.nextApprovalOfficer = AO[0].id
          production.comments.push({
            comment:data.comment,
            commentBy:user._id,
            officer:'Approving officer'
          });
          await production.save();
          await createLog({
            user:user._id,
            activities:{
              title:'production schedule',
              //@ts-ignore
              activity:`You Rejected a production schedule approval request made by ${production.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          await new Notify().push({
            subject: "Production Schedule",
            content: `A production schedule You Approved failed secondary approval please attend to the corrections. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
            user: approvalUser
          });
          return Promise.resolve(production);
        }
      }else {
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        // console.log(hod);
        if(production?.approvalStage == stagesOfApproval.START){
          let checkOfficer = production.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            production.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            });
          }
          //@ts-ignore
          // transfer.tracking.push(track)
          production.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          production.nextApprovalOfficer = hod?._id;
          production.comments.push({
            comment:data.comment,
            commentBy:user._id,
          })
          await production.save();
          await createLog({
            user:user._id,
            activities:{
              title:'production schedule',
              //@ts-ignore
              activity:`You Approved a production schedule approval request made by ${purchase.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          await new Notify().push({
            subject: "Production Schedule",
            content: `A production has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
            user: approvalUser
          });
          return Promise.resolve(production)
        }else if(production?.approvalStage == stagesOfApproval.STAGE1){
          let branchAdmin = await this.user.findOne({branch:hod?.branch, subrole:"superadmin"});
          let checkOfficer = production.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            production.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          //@ts-ignore
          // transfer.tracking.push(track)
          production.approvalStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          production.nextApprovalOfficer = branchAdmin?._id;
          production.comments.push({
            comment:data.comment,
            commentBy:user._id,
            officer:'Authorizing officer'
          })
          await production.save();
          await createLog({
            user:user._id,
            activities:{
              title:'production schedule',
              //@ts-ignore
              activity:`You Approved a production schedule approval request made by ${purchase.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          await new Notify().push({
            subject: "Production Schedule",
            content: `A production has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
            user: approvalUser
          });
          return Promise.resolve(production)
        } else if(production?.approvalStage == stagesOfApproval.STAGE2){
          let checkOfficer = production.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            production.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          // transfer.tracking.push(track)
          production.approvalStage = stagesOfApproval.APPROVED;
          production.status = TransferStatus.COMPLETED
          //@ts-ignore
          // transfer.nextApprovalOfficer = data.nextApprovalOfficer
          production.comments.push({
            comment:data.comment,
            commentBy:user._id,
            officer:'Approving officer'
          });
          await production.save();
          await createLog({
            user:user._id,
            activities:{
              title:'production schedule',
              //@ts-ignore
              activity:`You Approved a production schedule approval request made by ${purchase.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(production.initiator);
          await new Notify().push({
            subject: "Production Schedule",
            content: `A production you scheduled scheduled has been approved. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
            user: approvalUser
          });
          return Promise.resolve(production);
        }
      }
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchPendingProductionApprovals(query:QueryInterface, user:UserInterface):Promise<ProductionScheduleInterface[]|undefined>{
    try {
      let { page, limit, search, fromDate, toDate } = query;
      let options = {
        page:page||1,
        limit:limit||10,
        sort:{priority:1},
        populate:[
          {path:'customer', model:'customer'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:"cylinders", model:"registered-cylinders"},        
          {path:'ecr', model:'empty-cylinders'},
          {path:'branch', model:'branches'}
        ]
      }
      let q = {
        branch:user.branch,
        nextApprovalOfficer:user._id,
        status:TransferStatus.PENDING
      }
      let or = []

      if(search) {
        or.push({ecrNo: new RegExp(search, 'gi')})
        or.push({quantityToFill: new RegExp(search, 'gi')})
        or.push({status: new RegExp(search, 'gi')})
        or.push({productionNo: new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = { ...q, $or:or }
      }
      if(fromDate) {
        //@ts-ignore
        q = {...q, createdAt:{ $gte:new Date(fromDate) }}
      }
      if(toDate) {
        //@ts-ignore
        q = {...q, createdAt:{ $lte:new Date(toDate) }}
      }
      //@ts-ignore
      const productions = await this.production.paginate(q,options);
      return Promise.resolve(productions)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async viewProductionSchedule(productionId:string):Promise<ProductionScheduleInterface|undefined>{
    try {
      const production = await this.production.findById(productionId).populate([
        {path:'customer', model:'customer'},
        {path:'initiator', model:'User'},
        {path:'nextApprovalOfficer', model:'User'},
        {path:"cylinders", model:"registered-cylinders"},        
        {path:'ecr', model:'empty-cylinders'},
        {path:'branch', model:'branches'}
      ]);
      if(!production) {
        throw new BadInputFormatException('Production schedule not found');
      }
      return Promise.resolve(production);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchApprovedSchedules(query:QueryInterface, user:UserInterface):Promise<ProductionScheduleInterface[]|undefined>{
    try {
      let { page, limit, search, approvalStatus, ecr, fromDate } = query;
      let options = {
        page:page || 1,
        limit:limit || 10,
        populate:[
          {path:'customer', model:'customer'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:"cylinders", model:"registered-cylinders"},        
          {path:'ecr', model:'empty-cylinders'},
          {path:'branch', model:'branches'}
        ]
      }
      let q = {
        branch:user.branch
      }
      let or = [];
      if(approvalStatus) {
        or.push({status: new RegExp(approvalStatus, 'gi')})
      }

      if(ecr) {
        //@ts-ignore
        q = {...q, ecrNo:ecr}
      }

      if(fromDate) {
        //@ts-ignore
        q = {...q, date:{'$eq': new Date(fromDate)}}
      }
      if(search) {
        or.push({productionNo: new RegExp(search, 'gi')})
        or.push({shift: new RegExp(search, 'gi')})
        or.push({quantityToFill: new RegExp(search, 'gi')})
        or.push({'volumeToFill.value': new RegExp(search, 'gi')})
        or.push({'priority': new RegExp(search, 'gi')})
      }
      //@ts-ignore
      const productions = await this.production.paginate(q,options);
      // console.log(productions)
      return Promise.resolve(productions);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async markCompletedProduction(productionId:string):Promise<ProductionScheduleInterface|undefined>{
    try {
      const production = await this.production.findById(productionId);
      if(!production){
        throw new BadInputFormatException('production schedule not found')
      }
      production.produced = true;
      await production.save();
      let approvalUser = await this.user.findOne({role:'sales', subrole:'head of department', branch:production.branch});
          new Notify().push({
            subject: "Production complete",
            content: `Production schedule completed. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
            user: approvalUser
          });
      return Promise.resolve(production);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async markcompletedCylinders(updateProduction:UpdateProduction):Promise<any>{
    try {
      const { productionId, cylinders } = updateProduction;
      const production = await this.production.findById(productionId)
      if(!production) {
        throw new BadInputFormatException('production schedule not found');
      }
      let notFound = []
      for(let cyl of cylinders) {
        if(production.cylinders.includes(cyl)) {
          let c = await this.regCylinder.findById(cyl);
          if(c) {
            //@ts-ignore
            c.cylinderStatus = WalkinCustomerStatus.FILLED;
            await c.save();
          }
        }else {
          notFound.push(cyl);
        }
      }
      let message = notFound.length > 0? "Some cylinders were not found in this schedule" : "cylinders have been set to filled"
      // await this.production.findByIdAndUpdate(productionId, {cylinders}, {new:true});
      return Promise.resolve({
        message,
        production,
        not_found:notFound
      });
    } catch (e) {
      this.handleException(e);
    }
  }

}

export default ProductionSchedule;
