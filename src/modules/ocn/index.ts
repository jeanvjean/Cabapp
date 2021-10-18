import Module, { QueryInterface } from "../module";
import { Model } from "mongoose";
import { note, OutgoingCylinderInterface, statuses } from "../../models/ocn";
import { UserInterface } from "../../models/user";
import { stagesOfApproval, ApprovalStatus, TransferStatus } from "../../models/transferCylinder";
import Notify from '../../util/mail';
import Environment from '../../configs/static';
import { BadInputFormatException } from "../../exceptions";
import { createLog } from "../../util/logs";
import { generateToken, padLeft } from "../../util/token";
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
    customer?:OutgoingCylinderInterface['customer'],
    supplier?:OutgoingCylinderInterface['supplier']
    cylinderType?:OutgoingCylinderInterface['cylinderType']
    otherCylinders?:OutgoingCylinderInterface['otherCylinders']
    date?:OutgoingCylinderInterface['date']
    cylinders?:OutgoingCylinderInterface['cylinders']
    totalQty?:OutgoingCylinderInterface['totalQty']
    totalVol?:OutgoingCylinderInterface['totalVol']
    totalAmount?:OutgoingCylinderInterface['totalAmount']
    noteType?:OutgoingCylinderInterface['noteType']
    totalAsnlCylinders?:OutgoingCylinderInterface['totalAsnlCylinders']
    totalCustomerCylinders?:OutgoingCylinderInterface['totalCustomerCylinders']
    vehicle?:OutgoingCylinderInterface['vehicle'],
    type?:OutgoingCylinderInterface['type']
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
            let findOcn = await this.ocn.find({branch:user.branch}).sort({ocnInit:-1}).limit(1);
            let initNum
            if(findOcn[0] == undefined) {
              initNum = 1;
            }else {
              initNum = findOcn[0].ocnInit+1
            }
            let init = "OCN";
            if(data.noteType == note.IN) {
              init = "ICN"
            }
            const num = padLeft(initNum, 6, "");
            let grnNo = init+num;
            if(init == "ICN") {
              ocn.icnNo = grnNo
            }else if(init == "OCN") {
              ocn.ocnNo = grnNo
            }
            // ocn.ocnNo = grnNo;
            ocn.ocnInit = initNum;

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

    public async updateOcn(ocnId:string, data:newOcnInterface, user:UserInterface):Promise<OutgoingCylinderInterface|undefined> {
      try {
        let ocn = await this.ocn.findById(ocnId);
        if(!ocn) {
          throw new BadInputFormatException('ocn not found');
        }
        let updatedOcn = await this.ocn.findByIdAndUpdate(ocnId, {...data, status:statuses.PASSED}, {new:true});
        return Promise.resolve(updatedOcn as OutgoingCylinderInterface);
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
                  let branchAdmin = await this.user.findOne({branch:hod?.branch, subrole:"superadmin"});
                  //@ts-ignore
                  ocn.nextApprovalOfficer = branchAdmin?._id;
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
          const { search, page, limit } = query;
          let options = {
            page: page||1,
            limit:limit||1,
            populate:[
              {path:'customer', model:'customer' },
              {path:'approvalOfficers', model:'User'},
              {path:'nextApprovalOfficer', model:'User'},
              {path:'branch', model:'branches'},
              {path:"cylinders", model:"registered-cylinders"}
            ]
          }
          let q = {
            branch:user.branch,
            nextApprovalOfficer:user._id,
            approvalStatus:TransferStatus.PENDING
          }
          let or = []
          if(search) {
            or.push({cylinderType: new RegExp(search, 'gi')})
          }
          if(or.length > 0) {
            //@ts-ignore
            q = {...q, $or:or}
          }
          //@ts-ignore
            const outgoing = await this.ocn.paginate(q,options);
            return Promise.resolve(outgoing)
        } catch (e) {
            this.handleException(e);
        }
    }

    public async fetchOcns(query:QueryInterface, user:UserInterface):Promise<OutgoingCylinderInterface| undefined>{
      try {
        const ObjectId = mongoose.Types.ObjectId;
          const { search, filter, page, limit, noteType, type } = query;
          let options = {
            page: page||1,
            limit:limit||10,
            populate:[
              {path:'customer', model:'customer' },
              {path:'approvalOfficers', model:'User'},
              {path:'nextApprovalOfficer', model:'User'},
              {path:'branch', model:'branches'},
              {path:"cylinders", model:"registered-cylinders"}
            ]
          }
          let q = {
            branch:user.branch,
          }
          let or = []
          if(search) {
            or.push({cylinderType: new RegExp(search, 'gi')})
            or.push({approvalStatus:new RegExp(search,'gi')})
            or.push({icnNo: new RegExp(search, "gi")})
            or.push({ocnNo:new RegExp(search, 'gi')})
            or.push({noteType: new RegExp(search, 'gi')})
          }
          if(filter){
            //@ts-ignore
            q = {...q, status: filter}
          }
          if(noteType) {
            //@ts-ignore
            q = {...q, noteType: noteType}
          }
          if(type) {
            //@ts-ignore
            q = {...q, type: type}
          }
          if(or.length > 0) {
            //@ts-ignore
            q = {...q, $or:or}
          }
          //@ts-ignore
          const outgoing = await this.ocn.paginate(q,options);
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
                {path:'branch', model:'branches'},
                {path:"cylinders", model:"registered-cylinders"}
            ]);
            return Promise.resolve(outgoing as OutgoingCylinderInterface);
        } catch (e) {
            this.handleException(e);
        }
    }

}

export default OutGoingCylinder;

