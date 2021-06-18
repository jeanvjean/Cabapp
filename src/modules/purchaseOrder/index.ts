import { Model } from "mongoose";
import { PurchaseOrderInterface } from "../../models/purchaseOrder";
import Module, { QueryInterface } from "../module";
import { UserInterface } from "../../models/user";
import { stagesOfApproval, ApprovalStatus, TransferStatus } from "../../models/transferCylinder";
import { compareSync } from "bcryptjs";
import { BadInputFormatException } from "../../exceptions";
import env from '../../configs/static';
import Notify from '../../util/mail';
import { createLog } from "../../util/logs";


interface purchaseOrderProps{
    purchase:Model<PurchaseOrderInterface>
    user:Model<UserInterface>
}

interface newPurchaseOrder {
    customer:PurchaseOrderInterface['customer']
    date:PurchaseOrderInterface['date']
    cylinders:PurchaseOrderInterface['cylinders']
    comment:string
}

interface purchaseOrderPool {
    purchaseOrders:PurchaseOrderInterface[],
    approvedOrders:PurchaseOrderInterface[],
    pendingOrders:PurchaseOrderInterface[]
}

type ApprovePurchase = {
    comment:string,
    status:string,
    purchaseId:string,
    password:string,
}

class PurchaseOrder extends Module{
    private purchase:Model<PurchaseOrderInterface>
    private user:Model<UserInterface>

    constructor(props:purchaseOrderProps) {
        super()
        this.purchase = props.purchase
        this.user = props.user
    }

    public async createPurchaseOrder(data:newPurchaseOrder, user:UserInterface):Promise<PurchaseOrderInterface|undefined>{
        try {
            const purchase = new this.purchase(data);

            purchase.branch = user.branch

            purchase.initiator = user._id

            purchase.comments.push({
                comment:data.comment,
                commentBy:user._id
            });
            purchase.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            });
            let hod = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.branch});
            purchase.nextApprovalOfficer = hod?._id
            await purchase.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Purchase order',
                //@ts-ignore
                activity:`You created a new purchase order`,
                time: new Date().toISOString()
              }
            });
            let approvalUser = await this.user.findById(purchase.nextApprovalOfficer);
            await new Notify().push({
              subject: "Purchase Order",
              content: `A purchase order has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-order/${purchase._id}`,
              user: approvalUser
            });
            return Promise.resolve(purchase);
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchOrderDetails(orderId:string):Promise<PurchaseOrderInterface|undefined>{
        try {
            const order = await this.purchase.findById(orderId);
            return Promise.resolve(order as PurchaseOrderInterface);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchPurchaseOrders(query:QueryInterface, user:UserInterface):Promise<purchaseOrderPool|undefined>{
        try {
          //@ts-ignore
            const purchases = await this.purchase.paginate({ branch:user.branch },{...query});
            //@ts-ignore
            const approved = await this.purchase.paginate({ branch:user.branch, approvalStatus:TransferStatus.COMPLETED },{...query});
            //@ts-ignore
            const pending = await this.purchase.paginate({ branch:user.branch, approvalStatus:TransferStatus.PENDING },{...query});
            return Promise.resolve({
                purchaseOrders:purchases,
                approvedOrders:approved,
                pendingOrders:pending
            });
        } catch (e) {
            this.handleException(e);
        }
    }

    public async approvePurchaseOrder(data:ApprovePurchase, user:UserInterface):Promise<PurchaseOrderInterface|undefined>{
        try {
          let loginUser = await this.user.findById(user._id).select('+password');
          let matchPWD = await loginUser?.comparePWD(data.password, user.password);
          if(!matchPWD) {
            throw new BadInputFormatException('Incorrect password... please check the password');
          }
            const purchase = await this.purchase.findById(data.purchaseId).populate({
              path:'initiator', model:'User'
            });
            if(!purchase) {
              throw new BadInputFormatException('purchase order not found');
            }
            if(data.status == ApprovalStatus.REJECTED) {
                if(purchase?.approvalStage == stagesOfApproval.STAGE1){
                  let AO = purchase.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
                //   let track = {
                //     title:"Approval Process",
                //     stage:stagesOfApproval.STAGE2,
                //     status:ApprovalStatus.REJECTED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     nextApprovalOfficer:AO[0].id
                //   }
                  let checkOfficer = purchase.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
                  if(checkOfficer.length == 0) {
                    purchase.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE2
                    })
                  }
                  //@ts-ignore
                //   purchase.tracking.push(track)
                  purchase.approvalStage = stagesOfApproval.START
                  purchase.nextApprovalOfficer = AO[0].id
                  purchase.comments.push({
                    comment:data.comment,
                    commentBy:user._id
                  });
                  await purchase.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'Purchase Order',
                      //@ts-ignore
                      activity:`You rejected a purchase order approval request made by ${purchase.initiator.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let approvalUser = await this.user.findById(purchase.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Purchase Order",
                    content: `A purchase order you scheduled failed approval and requires your attention. click to view ${env.FRONTEND_URL}/fetch-order/${purchase._id}`,
                    user: approvalUser
                  });
                  return Promise.resolve(purchase);
                }else if(purchase?.approvalStage == stagesOfApproval.STAGE2) {
                  let AO = purchase.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
                //   let track = {
                //     title:"Approval Process",
                //     stage:stagesOfApproval.STAGE3,
                //     status:ApprovalStatus.REJECTED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     nextApprovalOfficer:AO[0].id
                //   }
                  let checkOfficer = purchase.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
                  if(checkOfficer.length == 0) {
                    purchase.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE3
                    });
                  }
                  //@ts-ignore
                //   purchase.tracking.push(track);
                  purchase.approvalStage = stagesOfApproval.STAGE1
                  purchase.nextApprovalOfficer = AO[0].id
                  purchase.comments.push({
                    comment:data.comment,
                    commentBy:user._id
                  })
                  await purchase.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'Purchase Order',
                      //@ts-ignore
                      activity:`You rejected a purchase order approval request made by ${purchase.initiator.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let approvalUser = await this.user.findById(purchase.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Purchase Order",
                    content: `A purchase order you Approved failed secondary approval and requires your attention. click to view ${env.FRONTEND_URL}/fetch-order/${purchase._id}`,
                    user: approvalUser
                  });
                  return Promise.resolve(purchase);
                }
              }else {
                let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
                  path:'branch', model:'branches'
                });
                // console.log(hod);
                if(purchase?.approvalStage == stagesOfApproval.START){
                //   let track = {
                //     title:"Approval Prorcess",
                //     stage:stagesOfApproval.STAGE1,
                //     status:ApprovalStatus.APPROVED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     nextApprovalOfficer:hod?._id
                //   }
                  let checkOfficer = purchase.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
                  if(checkOfficer.length == 0) {
                    purchase.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE1
                    });
                  }
                  //@ts-ignore
                //   purchase.tracking.push(track)
                  purchase.approvalStage = stagesOfApproval.STAGE1;
                  //@ts-ignore
                  purchase.nextApprovalOfficer = hod?._id;
                  purchase.comments.push({
                    comment:data.comment,
                    commentBy:user._id
                  })
                  await purchase.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'Purchase Order',
                      //@ts-ignore
                      activity:`You Approved a purchase order approval request made by ${purchase.initiator.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let approvalUser = await this.user.findById(purchase.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Purchase Order",
                    content: `A purchase order has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-order/${purchase._id}`,
                    user: approvalUser
                  });
                  return Promise.resolve(purchase)
                }else if(purchase?.approvalStage == stagesOfApproval.STAGE1){
                //   let track = {
                //     title:"Initiate Transfer",
                //     stage:stagesOfApproval.STAGE2,
                //     status:ApprovalStatus.APPROVED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     //@ts-ignore
                //     nextApprovalOfficer:hod?.branch.branchAdmin
                //   }
                  // console.log(track);
                  let checkOfficer = purchase.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
                  if(checkOfficer.length == 0){
                    purchase.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE2
                    });
                  }
                  //@ts-ignore
                //   purchase.tracking.push(track)
                  purchase.approvalStage = stagesOfApproval.STAGE2;
                  //@ts-ignore
                  purchase.nextApprovalOfficer = hod?.branch.branchAdmin;
                  purchase.comments.push({
                    comment:data.comment,
                    commentBy:user._id,
                    officer:'Authorizing officer'
                  });
                  await purchase.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'Purchase Order',
                      //@ts-ignore
                      activity:`You Approved a purchase order approval request made by ${purchase.initiator.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let approvalUser = await this.user.findById(purchase.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Purchase Order",
                    content: `A purchase order has been scheduled and requires your approval. click to view ${env.FRONTEND_URL}/fetch-order/${purchase._id}`,
                    user: approvalUser
                  });
                  return Promise.resolve(purchase)
                } else if(purchase?.approvalStage == stagesOfApproval.STAGE2){
                //   let track = {
                //     title:"Initiate Transfer",
                //     stage:stagesOfApproval.STAGE3,
                //     status:ApprovalStatus.APPROVED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     // nextApprovalOfficer:data.nextApprovalOfficer
                //   }
                  let checkOfficer = purchase.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
                  if(checkOfficer.length == 0){
                    purchase.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE3
                    });
                  }
                  //@ts-ignore
                //   purchase.tracking.push(track)
                  purchase.approvalStage = stagesOfApproval.APPROVED;
                  purchase.approvalStatus = TransferStatus.COMPLETED
                  //@ts-ignore
                  // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                  purchase.comments.push({
                    comment:data.comment,
                    commentBy:user._id,
                    officer:'Approving officer'
                  });
                  await purchase.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'Purchase Order',
                      //@ts-ignore
                      activity:`You Approved a purchase order approval request made by ${purchase.initiator.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let approvalUser = await this.user.findById(purchase.initiator);
                  await new Notify().push({
                    subject: "Purchase Order",
                    content: `A purchase order has been approved. click to view ${env.FRONTEND_URL}/fetch-order/${purchase._id}`,
                    user: approvalUser
                  });
                  return Promise.resolve(purchase)
                }
              }
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchPurchaseOrderRequests(query:QueryInterface, user:UserInterface):Promise<PurchaseOrderInterface[]|undefined>{
        try {
          //@ts-ignore
            const purchaseOrders = await this.purchase.paginate({ branch:user.branch, nextApprovalOfficer:user._id}, {...query});
            // let startStage = purchaseOrders.filter(purchase=> {
            //     if(purchase.approvalStage == stagesOfApproval.START) {
            //       for(let tofficer of purchase.approvalOfficers) {
            //         if(`${tofficer.id}` == `${user._id}`){
            //           if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
            //             return purchase
            //           }
            //         }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
            //           return purchase
            //         }
            //       }
            //     }
            //   });
            //   let stage1 = purchaseOrders.filter(purchase=>{
            //     if(purchase.approvalStage == stagesOfApproval.STAGE1) {
            //       for(let tofficer of purchase.approvalOfficers) {
            //         if(`${tofficer.id}` == `${user._id}`){
            //           if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
            //             return purchase
            //           }
            //         }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
            //           return purchase
            //         }
            //       }
            //     }
            //   });
              // let stage2 = purchaseOrders.filter(purchase=>{
              //   if(purchase.approvalStage == stagesOfApproval.STAGE2) {
              //     for(let tofficer of purchase.approvalOfficers) {
              //       if(`${tofficer.id}` == `${user._id}`){
              //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
              //           return purchase
              //         }
              //       }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
              //         return purchase
              //       }
              //     }
              //   }
              // });
              // let pendingApprovals;
              // if(user.subrole == 'superadmin'){
              //   pendingApprovals = stage2;
              // }else if(user.subrole == 'head of department'){
              //   pendingApprovals = stage1
              // }else {
              //   pendingApprovals = startStage;
              // }
            return Promise.resolve(purchaseOrders);
        } catch (e) {
            this.handleException(e)
        }
    }
}

export default PurchaseOrder;
