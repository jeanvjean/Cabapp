import { Model } from "mongoose";
import { SalesRequisitionInterface } from "../../models/sales-requisition";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";
import { RegisteredCylinderInterface, TypesOfCylinders } from "../../models/registeredCylinders";
import { BadInputFormatException } from "../../exceptions";
import { PurchaseOrderInterface } from "../../models/purchaseOrder";
import env from '../../configs/static';
import Notify from '../../util/mail';

interface salesRequisitionProps {
  sales:Model<SalesRequisitionInterface>
  user:Model<UserInterface>
  cylinder:Model<RegisteredCylinderInterface>
  purchase:Model<PurchaseOrderInterface>
}

interface newSaleRequisition{
  customerName:SalesRequisitionInterface['customerName']
  ecrNo:SalesRequisitionInterface['ecrNo']
  date:SalesRequisitionInterface['date']
  cylinders:SalesRequisitionInterface['cylinders']
  initiator:SalesRequisitionInterface['initiator']
  approvalStage:SalesRequisitionInterface['approvalStage']
  approvalOfficers:SalesRequisitionInterface['approvalOfficers']
  branch:SalesRequisitionInterface['branch']
  status:SalesRequisitionInterface['status']
}

type SalesApproval = {
  comment:string,
  status:string,
  salesId:string,
  nextApprovalOfficer?:string,
  password:string,
}

interface salesOrderReport {
  orders:SalesRequisitionInterface[]
  completed:SalesRequisitionInterface[]
  pending:SalesRequisitionInterface[]
}

interface purchaseOrderReport{
  orders:PurchaseOrderInterface[]
  completed:PurchaseOrderInterface[]
  pending:PurchaseOrderInterface[]
}


class Sale extends Module{
  private sales:Model<SalesRequisitionInterface>
  private user:Model<UserInterface>
  private cylinder:Model<RegisteredCylinderInterface>
  private purchase:Model<PurchaseOrderInterface>

  constructor(props:salesRequisitionProps){
    super()
    this.sales = props.sales
    this.user = props.user
    this.cylinder = props.cylinder
    this.purchase = props.purchase
  }

  public async createSalesRequisition(data:newSaleRequisition, user:UserInterface):Promise<SalesRequisitionInterface|undefined>{
    try {
      const sales = new this.sales(data);
      sales.branch = user.branch;
      sales.status = TransferStatus.PENDING;
      sales.preparedBy = user._id;
      await sales.save();
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSalesRequisition(query:QueryInterface, user:UserInterface):Promise<SalesRequisitionInterface[]|undefined>{
    try {
      const sales = await this.sales.find({...query, branch:user.branch});
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSalesReqDetails(salesId:string):Promise<SalesRequisitionInterface|undefined>{
    try {
      const sales = await this.sales.findById(salesId);
      return Promise.resolve(sales as SalesRequisitionInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveSalesRequisition(data:SalesApproval, user:UserInterface):Promise<SalesRequisitionInterface|undefined>{
    try {
      const sales = await this.sales.findById(data.salesId);
      if(data.status == ApprovalStatus.REJECTED) {
        if(sales?.approvalStage == stagesOfApproval.STAGE1){
          let AO = sales.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = sales.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          sales.tracking.push(track)
          sales.approvalStage = stagesOfApproval.START
          sales.nextApprovalOfficer = AO[0].id
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          let approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          new Notify().push({
            subject: "Sales Requisition", 
            content: `A Sales requisition you approved failed secondary approval and requires your attention. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`, 
            user: approvalUser
          });
          return Promise.resolve(sales)
        }else if(sales?.approvalStage == stagesOfApproval.STAGE2) {
          let AO = sales.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = sales.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          sales.tracking.push(track);
          sales.approvalStage = stagesOfApproval.STAGE1
          sales.nextApprovalOfficer = AO[0].id
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          let approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          new Notify().push({
            subject: "Sales Requisition", 
            content: `A Sales requisition you approved failed secondary approval and requires your attention. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`, 
            user: approvalUser
          });
          return Promise.resolve(sales);
        }
      }else {
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        // console.log(hod);
        if(sales?.approvalStage == stagesOfApproval.START){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:hod?._id
          }
          let checkOfficer = sales.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            });
          }
          //@ts-ignore
          sales.tracking.push(track)
          sales.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          sales.nextApprovalOfficer = hod?._id;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          let approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          new Notify().push({
            subject: "Sales Requisition", 
            content: `A Sales requisition has been created and requires your approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`, 
            user: approvalUser
          });
          return Promise.resolve(sales)
        }else if(sales?.approvalStage == stagesOfApproval.STAGE1){
          let track = {
            title:"Initiate Transfer",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            //@ts-ignore
            nextApprovalOfficer:hod?.branch.branchAdmin
          }
          // console.log(track);
          let checkOfficer = sales.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            sales.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          //@ts-ignore
          sales.tracking.push(track)
          sales.approvalStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          sales.nextApprovalOfficer = hod?.branch.branchAdmin;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          let approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          new Notify().push({
            subject: "Sales Requisition", 
            content: `A Sales requisition has been created and requires your approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`, 
            user: approvalUser
          });
          return Promise.resolve(sales);
        } else if(sales?.approvalStage == stagesOfApproval.STAGE2){
          let track = {
            title:"Initiate Transfer",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            // nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = sales.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            sales.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          sales.tracking.push(track)
          sales.approvalStage = stagesOfApproval.APPROVED;
          sales.status = TransferStatus.COMPLETED
          //@ts-ignore
          // transfer.nextApprovalOfficer = data.nextApprovalOfficer
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await sales.save();
          let approvalUser = await this.user.findById(sales.initiator);
          new Notify().push({
            subject: "Sales Requisition", 
            content: `A Sales requisition has been approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`, 
            user: approvalUser
          });
          return Promise.resolve(sales)
        }
      }
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchPendingRequisitionApproval(user:UserInterface):Promise<SalesRequisitionInterface[]|undefined>{
    try {
      const sales = await this.sales.find({status:TransferStatus.PENDING, branch:user.branch});
      let startStage = sales.filter(transfer=> {
        if(transfer.approvalStage == stagesOfApproval.START) {
          for(let tofficer of transfer.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                return transfer
              }
            }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
              return transfer
            }
          }
        }
      });
      let stage1 = sales.filter(transfer=>{
        if(transfer.approvalStage == stagesOfApproval.STAGE1) {
          for(let tofficer of transfer.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                return transfer
              }
            }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
              return transfer
            }
          }
        }
      });
      let stage2 = sales.filter(transfer=>{
        if(transfer.approvalStage == stagesOfApproval.STAGE2) {
          for(let tofficer of transfer.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                return transfer
              }
            }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
              return transfer
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

  public async returnedCylinder(cylinderId:string):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.cylinder.findById(cylinderId);
      if(!cylinder) {
        throw new BadInputFormatException('cylinder not found');
      }
      cylinder.cylinderType = TypesOfCylinders.BUFFER
      await cylinder.save();
      return Promise.resolve(cylinder);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderTransactions(user:UserInterface):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      const cylinders = await this.cylinder.find({branch:user.branch, cylinderType:TypesOfCylinders.ASSIGNED}).populate(
        {path:'assignedTo', model:'customer'}
      );
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async salesOrderTransaction(user:UserInterface):Promise<salesOrderReport|undefined>{
    try {
      const salesOrders = await this.sales.find({branch:user.branch});
      const completed = salesOrders.filter(sales=> sales.status == TransferStatus.COMPLETED);
      const in_progress = salesOrders.filter(sales=>sales.status == TransferStatus.PENDING);
      return Promise.resolve({
        orders:salesOrders,
        completed,
        pending:in_progress
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async purchaseOrderReport(user:UserInterface):Promise<purchaseOrderReport|undefined>{
    try {
      const purchaseOrder = await this.purchase.find({branch:user.branch});
      const completed = purchaseOrder.filter(order=> order.approvalStatus == TransferStatus.COMPLETED);
      const pending = purchaseOrder.filter(order=> order.approvalStatus == TransferStatus.PENDING);
      return Promise.resolve({
        orders:purchaseOrder,
        completed,
        pending
      });
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Sale;
