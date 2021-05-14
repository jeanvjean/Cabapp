import { Model } from "mongoose";
import { PurchaseOrderInterface } from "../../models/purchaseOrder";
import Module, { QueryInterface } from "../module";
import { UserInterface } from "../../models/user";
import { stagesOfApproval, ApprovalStatus, TransferStatus } from "../../models/transferCylinder";
import { compareSync } from "bcryptjs";
import { BadInputFormatException } from "../../exceptions";


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
            const purchases = await this.purchase.find({ ...query, branch:user.branch });
            const approved = purchases.filter(purchase=> purchase.approvalStatus == TransferStatus.COMPLETED);
            const pending = purchases.filter(purchase=> purchase.approvalStatus == TransferStatus.PENDING);
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
            let matchPWD = compareSync(data.password, user.password);
            if(!matchPWD) {
                throw new BadInputFormatException('Incorrect password... please check the password');
            }
            const purchase = await this.purchase.findById(data.purchaseId);
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
                  transfer.comments.push({
                    comment:data.comment,
                    commentBy:user._id,
                    officer:'Approving officer'
                  });
                  await purchase.save();
                  return Promise.resolve(purchase)
                }
              }
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchPurchaseOrderRequests(query:QueryInterface, user:UserInterface):Promise<PurchaseOrderInterface[]|undefined>{
        try {
            const purchaseOrders = await this.purchase.find({...query, branch:user.branch});
            let startStage = purchaseOrders.filter(purchase=> {
                if(purchase.approvalStage == stagesOfApproval.START) {
                  for(let tofficer of purchase.approvalOfficers) {
                    if(`${tofficer.id}` == `${user._id}`){
                      if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                        return purchase
                      }
                    }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
                      return purchase
                    }
                  }
                }
              });
              let stage1 = purchaseOrders.filter(purchase=>{
                if(purchase.approvalStage == stagesOfApproval.STAGE1) {
                  for(let tofficer of purchase.approvalOfficers) {
                    if(`${tofficer.id}` == `${user._id}`){
                      if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                        return purchase
                      }
                    }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
                      return purchase
                    }
                  }
                }
              });
              let stage2 = purchaseOrders.filter(purchase=>{
                if(purchase.approvalStage == stagesOfApproval.STAGE2) {
                  for(let tofficer of purchase.approvalOfficers) {
                    if(`${tofficer.id}` == `${user._id}`){
                      if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                        return purchase
                      }
                    }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
                      return purchase
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
            return Promise.resolve(pendingApprovals);
        } catch (e) {
            this.handleException(e)
        }
    }
}

export default PurchaseOrder;