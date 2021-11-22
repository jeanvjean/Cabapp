import { Model } from "mongoose";
import { PurchaseOrderInterface, purchaseType } from "../../models/purchaseOrder";
import Module, { QueryInterface } from "../module";
import { UserInterface } from "../../models/user";
import { stagesOfApproval, ApprovalStatus, TransferStatus } from "../../models/transferCylinder";
import { compareSync } from "bcryptjs";
import { BadInputFormatException } from "../../exceptions";
import env from '../../configs/static';
import Notify from '../../util/mail';
import { createLog } from "../../util/logs";
import { padLeft, passWdCheck } from "../../util/token";
import { EmptyCylinderInterface } from "../../models/emptyCylinder";
import { RegisteredCylinderInterface } from "../../models/registeredCylinders";


interface purchaseOrderProps{
    purchase:Model<PurchaseOrderInterface>
    user:Model<UserInterface>,
    ecr:Model<EmptyCylinderInterface>
    cylinder:Model<RegisteredCylinderInterface>
}

interface newPurchaseOrder {
    date:PurchaseOrderInterface['date']
    cylinders:PurchaseOrderInterface['cylinders']
    comment:string
    gasType:PurchaseOrderInterface['gasType']
    supplier?:PurchaseOrderInterface['supplier']
    fromBranch:PurchaseOrderInterface['fromBranch'],
    ecr: PurchaseOrderInterface['ecr']
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
    private ecr: Model<EmptyCylinderInterface>
    private cylinder: Model<RegisteredCylinderInterface>

    constructor(props:purchaseOrderProps) {
        super()
        this.purchase = props.purchase
        this.user = props.user
        this.ecr = props.ecr
        this.cylinder = props.cylinder
    }

    public async createPurchaseOrder(data:newPurchaseOrder, user:UserInterface):Promise<PurchaseOrderInterface|undefined>{
        try {
            const purchase = new this.purchase({
              ...data, 
              branch:user.branch, 
              initiator:user._id
            });
            let ex = await this.purchase.find({}).sort({initNum:-1}).limit(1);
            let on;
            if(ex[0]) {
              on = ex[0].initNum + 1
            }else {
              on = 1
            }
            let orderNumber = padLeft(on, 6, '');
            purchase.orderNumber = 'O'+orderNumber;
            purchase.initNum = on
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
            /**remove cylinders from ecr */
            let fEcr = await this.ecr.findById(purchase.ecr);
            if(!fEcr) {
              throw new BadInputFormatException('ecr id not found');
            }
            let removeArr = [];
            let remain = []
            for(let cyl of purchase.cylinders){
              let cylinder = await this.cylinder.findOne({cylinderNumber: cyl.cylinderNo})
              if(!cylinder) {
                throw new BadInputFormatException(`cylinder with number ${cyl.cylinderNo} does not seem to be found`)
              }
              if(!fEcr.cylinders.includes(cylinder._id)) {
                throw new BadInputFormatException(`cylinder with number ${cyl.cylinderNo} does not seem to be found on the ECR`)
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
            const order = await this.purchase.findById(orderId).populate([
              {path:'initiator', model:'User'},
              {path:'nextApprovalOfficer', model:'User'},
              {path:"supplier", model:"supplier"},
              {path:"branch", model:"branches"},
              {path:"fromBranch", model:"branches"}
            ]);
            return Promise.resolve(order as PurchaseOrderInterface);
        } catch (e) {
            this.handleException(e)
        }
    }

    public async fetchPurchaseOrders(query:QueryInterface, user:UserInterface):Promise<purchaseOrderPool|undefined>{
        try {
          let {page, limit, search, fromBranch, branch, approvalStatus, supplier, fromDate, toDate} = query;
          let options = {
            page: page || 1,
            limit:limit || 10,
            populate:[
              {path:'initiator', model:'User'},
              {path:'nextApprovalOfficer', model:'User'},
              {path:"supplier", model:"supplier"},
              {path:"branch", model:"branches"},
              {path:"fromBranch", model:"branches"}
            ]
          }
          let q = {
            branch:user.branch
          }
          let or = [];
          if(fromBranch) {
            //@ts-ignore
            q ={...q, fromBranch:fromBranch}
          }

          if(branch) {
            //@ts-ignore
            q ={...q, branch:branch}
          }
          if(supplier) {
            //@ts-ignore
            q ={...q, supplier:supplier}
          }
          if(fromDate) {
            //@ts-ignore
            q ={...q, date:new Date(fromDate)}
          }
          if(toDate) {
            //@ts-ignore
            q ={...q, date:new Date(toDate)}
          }
          if(approvalStatus) {
            //@ts-ignore
            q ={...q, approvalStatus:approvalStatus}
          }
          if(search) {
            or.push({type: new RegExp(search, 'gi')})
            or.push({'cylinders.volume': new RegExp(search, 'gi')})
            or.push({approvalStage: new RegExp(search, 'gi')})
            or.push({orderNumber: new RegExp(search, 'gi')})
          }
          if(or.length > 0) {
            //@ts-ignore
            q ={...q, $or:or}
          }
          //@ts-ignore
            const purchases = await this.purchase.paginate(q,options);
            //@ts-ignore
            const approved = await this.purchase.paginate({ branch:user.branch, approvalStatus:TransferStatus.COMPLETED },options);
            //@ts-ignore
            const pending = await this.purchase.paginate({ branch:user.branch, approvalStatus:TransferStatus.PENDING },options);
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
          await passWdCheck(user, data.password);
          // let loginUser = await this.user.findById(user._id).select('+password');
          // let matchPWD = await loginUser?.comparePWD(data.password, user.password);
          // if(!matchPWD) {
          //   throw new BadInputFormatException('Incorrect password... please check the password');
          // }
            const purchase = await this.purchase.findById(data.purchaseId).populate({
              path:'initiator', model:'User'
            });
            if(!purchase) {
              throw new BadInputFormatException('purchase order not found');
            }
            if(data.status == ApprovalStatus.REJECTED) {
                if(purchase?.approvalStage == stagesOfApproval.STAGE1){
                  let AO = purchase.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
               
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
                
                  let branchAdmin = await this.user.findOne({branch:hod?.branch, subrole:"superadmin"});
                  purchase.approvalStage = stagesOfApproval.STAGE2;
                  //@ts-ignore
                  purchase.nextApprovalOfficer = branchAdmin?._id;
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
          let {page, limit, search, fromBranch, branch, approvalStatus, supplier, fromDate, toDate} = query;
          let options = {
            page: page || 1,
            limit:limit || 10,
            populate:[
              {path:'initiator', model:'User'},
              {path:'nextApprovalOfficer', model:'User'},
              {path:"supplier", model:"supplier"},
              {path:"branch", model:"branches"},
              {path:"fromBranch", model:"branches"}
            ]
          }
          let q = {
            branch:user.branch,
            nextApprovalOfficer:user._id,
            approvalStatus:TransferStatus.PENDING
          }
          let or = [];
          if(fromBranch) {
            //@ts-ignore
            q ={...q, fromBranch:fromBranch}
          }

          if(branch) {
            //@ts-ignore
            q ={...q, branch:branch}
          }
          if(supplier) {
            //@ts-ignore
            q ={...q, supplier:supplier}
          }
          if(fromDate) {
            //@ts-ignore
            q ={...q, date:new Date(fromDate)}
          }
          if(toDate) {
            //@ts-ignore
            q ={...q, date:new Date(toDate)}
          }
          if(approvalStatus) {
            //@ts-ignore
            q ={...q, approvalStatus:approvalStatus}
          }
          if(search) {
            or.push({type: new RegExp(search, 'gi')})
            or.push({'cylinders.volume': new RegExp(search, 'gi')})
            or.push({approvalStage: new RegExp(search, 'gi')})
            or.push({orderNumber: new RegExp(search, 'gi')})
          }
          if(or.length > 0) {
            //@ts-ignore
            q ={...q, $or:or}
          }
          //@ts-ignore
            const purchaseOrders = await this.purchase.paginate(q, options);
            return Promise.resolve(purchaseOrders);
        } catch (e) {
            this.handleException(e)
        }
    }
}

export default PurchaseOrder;
