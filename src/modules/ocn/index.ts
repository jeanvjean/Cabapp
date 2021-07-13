import Module, { QueryInterface } from "../module";
import { Model } from "mongoose";
import { OutgoingCylinderInterface } from "../../models/ocn";
import { UserInterface } from "../../models/user";
import { stagesOfApproval, ApprovalStatus, TransferStatus } from "../../models/transferCylinder";
import Notify from '../../util/mail';
import Environment from '../../configs/static';
import { BadInputFormatException } from "../../exceptions";
import { createLog } from "../../util/logs";
import { generateToken } from "../../util/token";
import { mongoose } from "../cylinder";
import { CustomerInterface } from "../../models/customer";
import { BranchInterface } from "../../models/branch";

interface ocnPropsInterface {
    ocn:Model<OutgoingCylinderInterface>
    user:Model<UserInterface>
    customer:Model<CustomerInterface>
    branch:Model<BranchInterface>
}

interface newOcnInterface {
    customer:OutgoingCylinderInterface['customer'],
    cylinderType:OutgoingCylinderInterface['cylinderType']
    date:OutgoingCylinderInterface['date']
    cylinders:OutgoingCylinderInterface['cylinders']
    totalQty:OutgoingCylinderInterface['totalQty']
    totalVol:OutgoingCylinderInterface['totalVol']
    totalAmount:OutgoingCylinderInterface['totalAmount']
}

type ocnApproval = {
    comment:string,
    status:string,
    ocnId:string,
    password:string,
}

class OutGoingCylinder extends Module{
    private ocn:Model<OutgoingCylinderInterface>
    private user:Model<UserInterface>
    private branch:Model<BranchInterface>
    private customer:Model<CustomerInterface>

    constructor(props:ocnPropsInterface){
        super()
        this.ocn = props.ocn
        this.user = props.user;
        this.branch = props.branch
        this.customer = props.customer
    }

    public async createOCNRecord(data:newOcnInterface, user:UserInterface):Promise<OutgoingCylinderInterface|undefined>{
        try {
            const ocn = new this.ocn(data);
            const hod = await this.user.findOne({branch:user.branch, role:user.role, subrole:'head of department'});
            ocn.branch = user.branch;
            ocn.nextApprovalOfficer = hod?._id
            ocn.approvalOfficers.push({
                name:user.name,
                id:user._id,
                office:user.subrole,
                department:user.role,
                stageOfApproval:stagesOfApproval.STAGE1
            });
            let init = 'OCN'
            let num = await generateToken(6)
            //@ts-ignore
            let ocnNo = init + num.toString();
            ocn.ocnNo = ocnNo;
            await ocn.save();
            await createLog({
              user:user._id,
              activities:{
                title:'OCN request',
                //@ts-ignore
                activity:`You created a new out going cylinder note awaiting approval`,
                time: new Date().toISOString()
              }
            });
            let apUser = await this.user.findOne({role:'security', subrole:'head of department', branch:ocn.branch});
            await new Notify().push({
              subject: "Outgoing cylinder note (OCN)",
              content: `OCN generated. click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
              user: apUser
            });
            return Promise.resolve(ocn);
        } catch (e) {
            this.handleException(e);
        }
    }

    public async approveOcn(data:ocnApproval, user:UserInterface):Promise<OutgoingCylinderInterface|undefined>{
        try {
            const { ocnId, status } = data;
            const ocn = await this.ocn.findById(ocnId).populate({
              path:'customer', model:'customer'
            });
            console.log(ocn)
            if(!ocn) {
              throw new BadInputFormatException('OCN not found')
            }
            if(status == ApprovalStatus.REJECTED) {
                if(ocn?.approvalStage == stagesOfApproval.STAGE1){
                  let AO = ocn.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
                //   let track = {
                //     title:"Approval Process",
                //     stage:stagesOfApproval.STAGE2,
                //     status:ApprovalStatus.REJECTED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     nextApprovalOfficer:AO[0].id
                //   }
                  let checkOfficer = ocn.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
                  if(checkOfficer.length == 0) {
                    ocn.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE2
                    })
                  }
                  //@ts-ignore
                //   transfer.tracking.push(track)
                  ocn.approvalStage = stagesOfApproval.START
                  ocn.nextApprovalOfficer = AO[0].id
                //   ocn.comments.push({
                //     comment:data.comment,
                //     commentBy:user._id
                //   })
                  await ocn.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'OCN',
                      //@ts-ignore
                      activity:`You Rejected an Ocn approval request`,
                      time: new Date().toISOString()
                    }
                  });
                  let apUser = await this.user.findById(ocn.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Outgoing cylinder note(OCN)",
                    content: `An OCN you initiated has been rejected please check and make adiquate corrections. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                    user: apUser
                  });
                  return Promise.resolve(ocn);
                }else if(ocn?.approvalStage == stagesOfApproval.STAGE2) {
                  let AO = ocn.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
                //   let track = {
                //     title:"Approval Process",
                //     stage:stagesOfApproval.STAGE3,
                //     status:ApprovalStatus.REJECTED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     nextApprovalOfficer:AO[0].id
                //   }
                  let checkOfficer = ocn.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
                  if(checkOfficer.length == 0) {
                    ocn.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE3
                    });
                  }
                  //@ts-ignore
                //   ocn.tracking.push(track);
                  ocn.approvalStage = stagesOfApproval.STAGE1
                  ocn.nextApprovalOfficer = AO[0].id
                //   ocn.comments.push({
                //     comment:data.comment,
                //     commentBy:user._id
                //   })
                  await ocn.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'OCN',
                      //@ts-ignore
                      activity:`You Rejected an Ocn approval request`,
                      time: new Date().toISOString()
                    }
                  });
                  let apUser = await this.user.findById(ocn.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Outgoing cylinder note(OCN)",
                    content: `An OCN you Approved has been rejected please check and make adiquate corrections. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                    user: apUser
                  });
                  return Promise.resolve(ocn);
                }
              }else {
                let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
                  path:'branch', model:'branches'
                });
                // console.log(hod);
                if(ocn?.approvalStage == stagesOfApproval.START){
                //   let track = {
                //     title:"Approval Prorcess",
                //     stage:stagesOfApproval.STAGE1,
                //     status:ApprovalStatus.APPROVED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     nextApprovalOfficer:hod?._id
                //   }
                  let checkOfficer = ocn.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
                  console.log(checkOfficer);
                  if(checkOfficer.length == 0) {
                    ocn.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE1
                    });
                  }
                  //@ts-ignore
                //   ocn.tracking.push(track)
                  ocn.approvalStage = stagesOfApproval.STAGE1;
                  //@ts-ignore
                  ocn.nextApprovalOfficer = hod?._id;
                //   ocn.comments.push({
                //     comment:data.comment,
                //     commentBy:user._id
                //   })
                // console.log(ocn)
                  await ocn.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'OCN',
                      //@ts-ignore
                      activity:`You Approved an OCN approval request for ${ocn.customer.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let apUser = await this.user.findById(ocn.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Outgoing cylinder note(OCN)",
                    content: `An OCN has been initiatedand requires your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                    user: apUser
                  });
                  return Promise.resolve(ocn)
                }else if(ocn?.approvalStage == stagesOfApproval.STAGE1){
                //   let track = {
                //     title:"Initiate ocn",
                //     stage:stagesOfApproval.STAGE2,
                //     status:ApprovalStatus.APPROVED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     //@ts-ignore
                //     nextApprovalOfficer:hod?.branch.branchAdmin
                //   }
                  // console.log(track);
                  let checkOfficer = ocn.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
                  if(checkOfficer.length == 0){
                    ocn.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE2
                    });
                  }
                  //@ts-ignore
                  // ocn.tracking.push(track)
                  ocn.approvalStage = stagesOfApproval.STAGE2;
                  // console.log(hod)
                  //@ts-ignore
                  ocn.nextApprovalOfficer = hod?.branch.branchAdmin;
                //   ocn.comments.push({
                //     comment:data.comment,
                //     commentBy:user._id
                //   })
                  await ocn.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'OCN',
                      //@ts-ignore
                      activity:`You Approved an OCN approval request for ${ocn.customer.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let apUser = await this.user.findById(ocn.nextApprovalOfficer);
                  await new Notify().push({
                    subject: "Outgoing cylinder note(OCN)",
                    content: `An OCN has been initiatedand requires your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                    user: apUser
                  });
                  return Promise.resolve(ocn)
                } else if(ocn?.approvalStage == stagesOfApproval.STAGE2){
                //   let track = {
                //     title:"Initiate Transfer",
                //     stage:stagesOfApproval.STAGE3,
                //     status:ApprovalStatus.APPROVED,
                //     dateApproved:new Date().toISOString(),
                //     approvalOfficer:user._id,
                //     // nextApprovalOfficer:data.nextApprovalOfficer
                //   }
                  let checkOfficer = ocn.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
                  if(checkOfficer.length == 0){
                    ocn.approvalOfficers.push({
                      name:user.name,
                      id:user._id,
                      office:user.subrole,
                      department:user.role,
                      stageOfApproval:stagesOfApproval.STAGE3
                    });
                  }
                  //@ts-ignore
                //   transfer.tracking.push(track)
                  ocn.approvalStage = stagesOfApproval.APPROVED;
                  ocn.approvalStatus = TransferStatus.COMPLETED
                  //@ts-ignore
                  // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                //   transfer.comments.push(ocn);
                  await ocn.save();
                  await createLog({
                    user:user._id,
                    activities:{
                      title:'OCN',
                      //@ts-ignore
                      activity:`You Approved an OCN approval request for ${ocn.customer.name}`,
                      time: new Date().toISOString()
                    }
                  });
                  let apUser = await this.user.findOne({role:'security', subrole:'head of department', branch:ocn.branch});
                  await new Notify().push({
                    subject: "Outgoing cylinder note (OCN)",
                    content: `OCN approval complete. click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                    user: apUser
                  });
                  return Promise.resolve(ocn);
                }
              }
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchOcnApprovals(query:QueryInterface, user:UserInterface) :Promise<OutgoingCylinderInterface[]|undefined>{
        try {
          const ObjectId = mongoose.Types.ObjectId;
          const { search } = query;
          const aggregate = this.ocn.aggregate([
            {
              $match:{
                $and:[
                  {
                    $or:[
                      {cylinderType:{
                        $regex: search?.toLowerCase() || ""
                      }}
                    ]
                  },
                  {branch:ObjectId(user.branch.toString())},
                  {nextApprovalOfficer:ObjectId(user._id.toString())},
                  {approvalStatus:TransferStatus.PENDING}
                ]
              }
            }
          ]);
          //@ts-ignore
            const outgoing = await this.ocn.aggregatePaginate(aggregate,{...query});
            for(let o of outgoing.docs) {
              let nextApprovalOfficer = await this.user.findById(o.nextApprovalOfficer);
              o.nextApprovalOfficer = nextApprovalOfficer;
              let customer = await this.customer.findById(o.customer);
              o.customer = customer;
              let branch = await this.branch.findById(o.branch);
              o.branch = branch;
            }
            // let startStage = outgoing.filter(outgoing=> {
            //     if(outgoing.approvalStage == stagesOfApproval.START) {
            //       for(let tofficer of outgoing.approvalOfficers) {
            //         if(`${tofficer.id}` == `${user._id}`){
            //           if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
            //             return outgoing
            //           }
            //         }else if(`${outgoing.nextApprovalOfficer}` == `${user._id}`){
            //           return outgoing
            //         }
            //       }
            //     }
            //   });
            //   let stage1 = outgoing.filter(outgoing=>{
            //     if(outgoing.approvalStage == stagesOfApproval.STAGE1) {
            //       for(let tofficer of outgoing.approvalOfficers) {
            //         if(`${tofficer.id}` == `${user._id}`){
            //           if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
            //             return outgoing
            //           }
            //         }else if(`${outgoing.nextApprovalOfficer}` == `${user._id}`){
            //           return outgoing
            //         }
            //       }
            //     }
            //   });
              // let stage2 = outgoing.filter(outgoing=>{
              //   if(outgoing.approvalStage == stagesOfApproval.STAGE2) {
              //     for(let tofficer of outgoing.approvalOfficers) {
              //       if(`${tofficer.id}` == `${user._id}`){
              //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
              //           return outgoing
              //         }
              //       }else if(`${outgoing.nextApprovalOfficer}` == `${user._id}`){
              //         return outgoing
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
              return Promise.resolve(outgoing)
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchOcns(query:QueryInterface, user:UserInterface):Promise<OutgoingCylinderInterface| undefined>{
      try {
        const ObjectId = mongoose.Types.ObjectId;
          const { search } = query;
          const aggregate = this.ocn.aggregate([
            {
              $match:{
                $and:[
                  {
                    $or:[
                      {cylinderType:{
                        $regex: search?.toLowerCase() || ""
                      }},{approvalStatus:{
                        $regex: search?.toLowerCase() || ""
                      }}
                    ]
                  },
                  {branch:ObjectId(user.branch.toString())}
                ]
              }
            }
          ]);
          //@ts-ignore
          const outgoing = await this.ocn.aggregatePaginate(aggregate,{...query});
          for(let o of outgoing.docs) {
            let nextApprovalOfficer = await this.user.findById(o.nextApprovalOfficer);
            o.nextApprovalOfficer = nextApprovalOfficer;
            let customer = await this.customer.findById(o.customer);
            o.customer = customer;
            let branch = await this.branch.findById(o.branch);
            o.branch = branch;
          }
          return Promise.resolve(outgoing)
      } catch (e) {
        this.handleException(e);
      }
    }

    public async viewOcnDetails(ocnId:string):Promise<OutgoingCylinderInterface|undefined>{
        try {
            const outgoing = await this.ocn.findById(ocnId).populate([
                {path:'customer', model:'customer' },
                {path:'approvalOfficers', model:'User'},
                {path:'nextApprovalOfficer', model:'User'},
                {path:'branch', model:'branches'}
            ]);
            return Promise.resolve(outgoing as OutgoingCylinderInterface);
        } catch (e) {
            this.handleException(e);
        }
    }

}

export default OutGoingCylinder;
