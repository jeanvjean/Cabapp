import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ProductionScheduleInterface } from "../../models/productionSchedule";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";
import { compareSync } from "bcryptjs";
import env from '../../configs/static';
import Notify from '../../util/mail';

interface productionModuleProps {
  production:Model<ProductionScheduleInterface>,
  user:Model<UserInterface>
}

interface newProductionInterface{
  customer:ProductionScheduleInterface['customer']
  productionNo:ProductionScheduleInterface['productionNo']
  ecrNo:ProductionScheduleInterface['ecrNo']
  shift:ProductionScheduleInterface['shift']
  date:ProductionScheduleInterface['date']
  cylinders:ProductionScheduleInterface['cylinders']
  quantityToFill:ProductionScheduleInterface['quantityToFill']
  volumeToFill:ProductionScheduleInterface['volumeToFill']
  totalQuantity:ProductionScheduleInterface['totalQuantity']
  totalVolume:ProductionScheduleInterface['totalQuantity']
  comment:string
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

  constructor(props:productionModuleProps){
    super()
    this.production = props.production
    this.user = props.user
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

      production.comments.push({
        comment:data.comment,
        commentBy:user._id
      });
      await production.save();
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
        let matchPWD = compareSync(data.password, user.password);
        if(!matchPWD) {
          throw new BadInputFormatException('Incorrect password... please check the password');
        }
      const production = await this.production.findById(data.productionId);
      if(data.status == ApprovalStatus.REJECTED) {
        if(production?.approvalStage == stagesOfApproval.STAGE1){
          let AO = production.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          // let track = {
          //   title:"Approval Process",
          //   stage:stagesOfApproval.STAGE2,
          //   status:ApprovalStatus.REJECTED,
          //   dateApproved:new Date().toISOString(),
          //   approvalOfficer:user._id,
          //   nextApprovalOfficer:AO[0].id
          // }
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
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          new Notify().push({
            subject: "Production Schedule", 
            content: `A production schedule You initiated failed approval please attend to the corrections. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`, 
            user: approvalUser
          });
          return Promise.resolve(production);
        }else if(production?.approvalStage == stagesOfApproval.STAGE2) {
          let AO = production.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
          // let track = {
          //   title:"Approval Process",
          //   stage:stagesOfApproval.STAGE3,
          //   status:ApprovalStatus.REJECTED,
          //   dateApproved:new Date().toISOString(),
          //   approvalOfficer:user._id,
          //   nextApprovalOfficer:AO[0].id
          // }
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
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          new Notify().push({
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
          // let track = {
          //   title:"Approval Prorcess",
          //   stage:stagesOfApproval.STAGE1,
          //   status:ApprovalStatus.APPROVED,
          //   dateApproved:new Date().toISOString(),
          //   approvalOfficer:user._id,
          //   nextApprovalOfficer:hod?._id
          // }
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
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          new Notify().push({
            subject: "Production Schedule", 
            content: `A production has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`, 
            user: approvalUser
          });
          return Promise.resolve(production)
        }else if(production?.approvalStage == stagesOfApproval.STAGE1){
          // let track = {
          //   title:"Initiate Transfer",
          //   stage:stagesOfApproval.STAGE2,
          //   status:ApprovalStatus.APPROVED,
          //   dateApproved:new Date().toISOString(),
          //   approvalOfficer:user._id,
          //   //@ts-ignore
          //   nextApprovalOfficer:hod?.branch.branchAdmin
          // }
          // console.log(track);
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
          production.nextApprovalOfficer = hod?.branch.branchAdmin;
          production.comments.push({
            comment:data.comment,
            commentBy:user._id,
            officer:'Authorizing officer'
          })
          await production.save();
          let approvalUser = await this.user.findById(production.nextApprovalOfficer);
          new Notify().push({
            subject: "Production Schedule", 
            content: `A production has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`, 
            user: approvalUser
          });
          return Promise.resolve(production)
        } else if(production?.approvalStage == stagesOfApproval.STAGE2){
          // let track = {
          //   title:"Initiate Transfer",
          //   stage:stagesOfApproval.STAGE3,
          //   status:ApprovalStatus.APPROVED,
          //   dateApproved:new Date().toISOString(),
          //   approvalOfficer:user._id,
          //   // nextApprovalOfficer:data.nextApprovalOfficer
          // }
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
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id,
            officer:'Approving officer'
          });
          await production.save();
          let approvalUser = await this.user.findById(production.initiator);
          new Notify().push({
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
      const productions = await this.production.find({...query, branch:user.branch});
      let startStage = productions.filter(production=> {
        if(production.approvalStage == stagesOfApproval.START) {
          for(let tofficer of production.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                return production
              }
            }else if(`${production.nextApprovalOfficer}` == `${user._id}`){
              return production
            }
          }
        }
      });
      let stage1 = productions.filter(production=>{
        if(production.approvalStage == stagesOfApproval.STAGE1) {
          for(let tofficer of production.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                return production
              }
            }else if(`${production.nextApprovalOfficer}` == `${user._id}`){
              return production
            }
          }
        }
      });
      let stage2 = productions.filter(production=>{
        if(production.approvalStage == stagesOfApproval.STAGE2) {
          for(let tofficer of production.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                return production
              }
            }else if(`${production.nextApprovalOfficer}` == `${user._id}`){
              return production
            }
          }
        }
      });
      let pendingApprovals;
      if(user.subrole == 'superadmin'){
        pendingApprovals = stage2;
      }else if(user.subrole == 'head of department'){
        pendingApprovals = stage1
      }else {
        pendingApprovals = startStage;
      }
      return Promise.resolve(pendingApprovals)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async viewProductionSchedule(productionId:string):Promise<ProductionScheduleInterface|undefined>{
    try {
      const production = await this.production.findById(productionId);
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
      const productions = await this.production.find({...query, branch:user.branch});
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
      let approvalUser = await this.user.findById({role:'sales', subrole:'head of department', branch:production.branch});
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

  public async markcompletedCylinders(updateProduction:UpdateProduction):Promise<ProductionScheduleInterface|undefined>{
    try {
      const { productionId, cylinders } = updateProduction;
      const production = await this.production.findById(productionId)
      if(!production) {
        throw new BadInputFormatException('production schedule not found');
      }
      await this.production.findByIdAndUpdate(productionId, {cylinders}, {new:true});
      return Promise.resolve(production);
    } catch (e) {
      this.handleException(e);
    }
  }

}

export default ProductionSchedule;
