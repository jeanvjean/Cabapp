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
import { createLog } from "../../util/logs";

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
      await createLog({
        user:user._id,
        activities:{
          title:'Sales requisition',
          activity:'Created asales requisition awaiting approval',
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSalesRequisition(query:QueryInterface, user:UserInterface):Promise<SalesRequisitionInterface[]|undefined>{
    try {
      let options = {
        page: query.page || 1,
        limit:query.limit || 10,
        populate:[
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'preparedBy', model:'User'}
        ]
      }
      //@ts-ignore
      const sales = await this.sales.paginate({ branch:user.branch},options);
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSalesReqDetails(salesId:string):Promise<SalesRequisitionInterface|undefined>{
    try {
      const sales = await this.sales.findById(salesId).populate([
        {path:'initiator', model:'User'},
        {path:'nextApprovalOfficer', model:'User'},
        {path:'preparedBy', model:'User'}
      ]);
      return Promise.resolve(sales as SalesRequisitionInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveSalesRequisition(data:SalesApproval, user:UserInterface):Promise<SalesRequisitionInterface|undefined>{
    try {
      let loginUser = await this.user.findById(user._id).select('+password');
      let matchPWD = await loginUser?.comparePWD(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      const sales = await this.sales.findById(data.salesId).populate({
        path:'initiator', model:'User'
      });
      if(!sales) {
        throw new BadInputFormatException('sales requisition not found')
      }
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
          sales.initiated = true;
          sales.initiator = user._id
          sales.nextApprovalOfficer = AO[0].id
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Sales requisition',
              //@ts-ignore
              activity:`rejected a requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Sales requisition',
              //@ts-ignore
              activity:`rejected a requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Sales requisition',
              //@ts-ignore
              activity:`Approved a sales requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          await new Notify().push({
            subject: "Sales Requisition",
            content: `A Sales requisition has been created and requires your approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
            user: approvalUser
          });
          return Promise.resolve(sales)
        }else if(sales?.approvalStage == stagesOfApproval.STAGE1){          
          let branchAdmin = await this.user.findOne({branch:hod?.branch, subrole:"superadmin"});
          let track = {
            title:"Initiate Transfer",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            //@ts-ignore
            nextApprovalOfficer:branchAdmin?._id
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
          sales.nextApprovalOfficer = branchAdmin?._id;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Sales requisition',
              //@ts-ignore
              activity:`Approved a sales requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          await new Notify().push({
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
          sales.status = TransferStatus.COMPLETED;

          // transfer.nextApprovalOfficer = data.nextApprovalOfficer
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // });
          // console.log(sales);
          await sales.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Sales requisition',
              //@ts-ignore
              activity:`Approved a sales requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let approvalUser = await this.user.findById(sales.initiator);
         await new Notify().push({
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

  public async fetchPendingRequisitionApproval(query:QueryInterface, user:UserInterface):Promise<SalesRequisitionInterface[]|undefined>{
    try {
      //@ts-ignore
      const sales = await this.sales.paginate({
        status:TransferStatus.PENDING,
        branch:user.branch,
        nextApprovalOfficer:user._id
      },{...query});
      return Promise.resolve(sales)
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

  public async cylinderTransactions(query:QueryInterface, user:UserInterface):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      const options = {
        ...query,
        populate:[
          {path:'assignedTo', model:'customer'}
        ]
      }
      //@ts-ignore
      const cylinders = await this.cylinder.paginate({branch:user.branch, cylinderType:TypesOfCylinders.ASSIGNED}, options);
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderTransactionsDownload(user:UserInterface):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      // const options = {
      //   ...query,
      //   populate:[
      //     {path:'assignedTo', model:'customer'}
      //   ]
      // }
      //@ts-ignore
      const cylinders = await this.cylinder.find({branch:user.branch, cylinderType:TypesOfCylinders.ASSIGNED});
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async salesOrderTransaction(query:QueryInterface, user:UserInterface):Promise<salesOrderReport|undefined>{
    try {
      //@ts-ignore
      const salesOrders = await this.sales.find({branch:user.branch},{...query});
      //@ts-ignore
      const completed =  await this.sales.find({branch:user.branch, status:TransferStatus.COMPLETED},{...query});
      //@ts-ignore
      const in_progress = await this.sales.find({branch:user.branch, status:TransferStatus.PENDING},{...query});
      return Promise.resolve({
        orders:salesOrders,
        completed,
        pending:in_progress
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async salesOrderDownload(user:UserInterface):Promise<salesOrderReport|undefined>{
    try {
      //@ts-ignore
      const salesOrders = await this.sales.find({branch:user.branch});
      //@ts-ignore
      const completed =  await this.sales.find({branch:user.branch, status:TransferStatus.COMPLETED});
      //@ts-ignore
      const in_progress = await this.sales.find({branch:user.branch, status:TransferStatus.PENDING});
      return Promise.resolve({
        orders:salesOrders,
        completed,
        pending:in_progress
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async purchaseOrderReport(query:QueryInterface, user:UserInterface):Promise<purchaseOrderReport|undefined>{
    try {
      let options = {
        page: query.page || 1,
        limit:query.limit || 10,
        populate:[
          {path:"nextApprovalOfficer", model:"User"},
          {path:"initiator", model:"User"},
          {path:"branch", model:"branches"},
          {path:"customer", model:"customer"}
        ]
      }
      //@ts-ignore
      const purchaseOrder = await this.purchase.paginate({branch:user.branch},options);
      //@ts-ignore
      const completed =  await this.purchase.paginate({branch:user.branch, approvalStatus:TransferStatus.COMPLETED},options);
      //@ts-ignore
      const pending =  await this.purchase.paginate({branch:user.branch, approvalStatus:TransferStatus.PENDING},options);
      return Promise.resolve({
        orders:purchaseOrder,
        completed,
        pending
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async purchaseReportDowndload(user:UserInterface):Promise<any>{
    try {
      let options = {
        // page: query.page || 1,
        // limit:query.limit || 10,
        populate:[
          {path:"nextApprovalOfficer", model:"User"},
          {path:"initiator", model:"User"},
          {path:"branch", model:"branches"},
          {path:"customer", model:"customer"}
        ]
      }
      //@ts-ignore
      const purchaseOrder = await this.purchase.find({branch:user.branch},options);
      //@ts-ignore
      const completed =  await this.purchase.find({branch:user.branch, approvalStatus:TransferStatus.COMPLETED}, options);
      //@ts-ignore
      const pending =  await this.purchase.find({branch:user.branch, approvalStatus:TransferStatus.PENDING},options);
      return Promise.resolve({
        orders:purchaseOrder,
        completed,
        pending
      });
    } catch (e) {
      this.handleException(e)
    }
  }
}

export default Sale;
