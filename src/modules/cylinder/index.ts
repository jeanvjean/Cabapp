import { compareSync } from "bcryptjs";
import { verify } from "jsonwebtoken";
import { Model } from "mongoose";
import { cylinder } from "..";
import { BadInputFormatException } from "../../exceptions";
import { CylinderCondition, CylinderInterface, cylinderTypes } from "../../models/cylinder";
import { RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { ApprovalStatus, stagesOfApproval, TransferCylinder, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";
import { signTokenKey } from "../user";

type CylinderProps = {
  cylinder: Model<CylinderInterface>
  registerCylinder: Model<RegisteredCylinderInterface>
  transfer: Model<TransferCylinder>
}

interface NewCylinderInterface{
  gasName:CylinderInterface['gasName'],
  colorCode:CylinderInterface['colorCode']
}

interface NewCylinderRegisterationInterface{
  cylinderType:RegisteredCylinderInterface['cylinderType'],
  waterCapacity:RegisteredCylinderInterface['waterCapacity'],
  dateManufactured:RegisteredCylinderInterface['dateManufactured'],
  assignedTo:RegisteredCylinderInterface['assignedTo'],
  gasType:RegisteredCylinderInterface['gasType'],
  standardColor:RegisteredCylinderInterface['standardColor'],
  assignedNumber:RegisteredCylinderInterface['assignedNumber'],
  testingPresure:RegisteredCylinderInterface['testingPresure'],
  fillingPreasure:RegisteredCylinderInterface['fillingPreasure'],
  gasVolumeContent:RegisteredCylinderInterface['gasVolumeContent'],
  cylinderNumber:RegisteredCylinderInterface['cylinderNumber']
}

interface CylinderCountInterface{
  totalCylinders:number,
  totalBufferCylinders:number,
  totalAssignedCylinders:number
}

interface FetchCylinderInterface {
  cylinders:CylinderInterface[],
  counts:CylinderCountInterface
}

interface TransferCylinderInput {
  cylinders:string[]
  to:string
  type:string
  comment?:string
  nextApprovalOfficer?:string
}

interface ApprovalResponse{
  message:string
  transfer:TransferCylinder
}

export interface ApprovalInput{
  comment:string,
  status:string,
  id:string,
  nextApprovalOfficer?:string,
  password:string
}

type countTransferedCylinders = {
  totalTransfers:number,
  totalApproved:number,
  totalPending:number
}

interface TransferRequestPool{
  transfer:TransferCylinder[]
  counts: countTransferedCylinders
  message?:string
}

interface FilterCylinderResponse {
  damaged:RegisteredCylinderInterface[],
  repair:RegisteredCylinderInterface[]
}

interface RegisteredCylinderPoolInterface {
  cylinders:RegisteredCylinderInterface[],
  counts:CylinderCountInterface
}


class Cylinder extends Module {
  private cylinder:Model<CylinderInterface>
  private registerCylinder:Model<RegisteredCylinderInterface>
  private transfer: Model<TransferCylinder>

  constructor(props:CylinderProps) {
    super()
    this.cylinder = props.cylinder
    this.registerCylinder = props.registerCylinder
    this.transfer = props.transfer
  }

  public async createCylinder(data:NewCylinderInterface, user:UserInterface): Promise<CylinderInterface|undefined> {
    try {
      let exist = await this.cylinder.findOne({colorCode: data.colorCode})
      if(exist) {
        throw new BadInputFormatException('this color code is assigned to a gas type');
      }
      let payload = {
        ...data,
        creator:user._id
      }
      let newGas = await this.cylinder.create(payload);
      return Promise.resolve(newGas);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchCylinders(query:QueryInterface): Promise<FetchCylinderInterface|undefined>{
    try {
      const cylinders = await this.cylinder.find(query);
      let bufferCylinders = cylinders.filter(cylinder=> cylinder.type == cylinderTypes.BUFFER);
      let assignedCylinders = cylinders.filter(cylinder=> cylinder.type == cylinderTypes.ASSIGNED);
      return Promise.resolve({
        cylinders,
        counts:{
          totalCylinders:cylinders.length|0,
          totalBufferCylinders:bufferCylinders.length|0,
          totalAssignedCylinders:assignedCylinders.length|0
        }
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderDetails(id:string) :Promise<CylinderInterface|undefined>{
    try {
      const cylinder = await this.cylinder.findById(id);
      return Promise.resolve(cylinder as CylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async regCylinder(data:NewCylinderRegisterationInterface, user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    // console.log(data)
    try {
      let manDate = new Date(data.dateManufactured);
      let payload = {
        ...data,
        dateManufactured:manDate.toISOString()
      }
      let newRegistration:NewCylinderRegisterationInterface|undefined = await this.registerCylinder.create(payload);
      return Promise.resolve(newRegistration as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchRegisteredCylinders(query:QueryInterface, user:UserInterface):Promise<RegisteredCylinderPoolInterface|undefined>{
    try {
      const registeredCylinders = await this.registerCylinder.find(query);
      const bufferCylinders = registeredCylinders.filter(cylinder=> cylinder.cylinderType == cylinderTypes.BUFFER);
      const assignedCylinders = registeredCylinders.filter(cylinder=> cylinder.cylinderType == cylinderTypes.ASSIGNED);
      return Promise.resolve({
        cylinders:registeredCylinders,
        counts:{
          totalCylinders:registeredCylinders.length|0,
          totalBufferCylinders:bufferCylinders.length|0,
          totalAssignedCylinders:assignedCylinders.length|0
        }
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchRegisteredCylinder(id:string,user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(id);
      return Promise.resolve(cylinder as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDamagedCylinders(query:QueryInterface):Promise<FilterCylinderResponse|undefined>{
    try {
      const cylinders = await this.registerCylinder.find(query);
      const damaged = cylinders.filter(cylinder=> cylinder.condition == CylinderCondition.DAMAGED);
      const repair = cylinders.filter(cylinder=> cylinder.condition == CylinderCondition.REPAIR);
      return Promise.resolve({
        damaged:damaged,
        repair:repair
      });
    } catch (e) {

    }
  }

  public async transferCylinders(data:TransferCylinderInput, user:UserInterface):Promise<TransferCylinder|undefined>{
    try {
      let transfer = new this.transfer(data);
      transfer.initiator = user._id,
      transfer.transferStatus = TransferStatus.PENDING
      transfer.approvalStage = stagesOfApproval.STAGE1 //stage has been approved
      let track = {
        title:"Initiate Transfer",
        stage:stagesOfApproval.STAGE1,
        status:ApprovalStatus.APPROVED,
        dateApproved:new Date().toISOString(),
        approvalOfficer:user._id,
        nextApprovalOfficer:data.nextApprovalOfficer
      }
      //@ts-ignore
      transfer.tracking.push(track)
      transfer.approvalOfficers.push({
        name:user.name,
        id:user._id,
        office:user.subrole,
        department:user.role,
        stageOfApproval:stagesOfApproval.STAGE1
      });
      let com = {
        comment:data.comment,
        commentBy:user._id
      }
      //@ts-ignore
      transfer.comments.push(com);
      transfer.transferStatus = TransferStatus.PENDING;
      await transfer.save();

      return Promise.resolve(transfer)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveTransfer(data:ApprovalInput, user:UserInterface):Promise<ApprovalResponse|undefined>{
    try {
      let matchPWD = compareSync(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      let transfer = await this.transfer.findById(data.id);
      if(data.status == ApprovalStatus.REJECTED) {
        if(transfer?.approvalStage == stagesOfApproval.STAGE1){
          let AO = transfer.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = transfer.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            transfer.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          transfer.tracking.push(track)
          transfer.approvalStage = stagesOfApproval.START
          transfer.nextApprovalOfficer = AO[0].id
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          return Promise.resolve({
            message:"Rejected",
            transfer
          })
        }else if(transfer?.approvalStage == stagesOfApproval.STAGE2) {
          let AO = transfer.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = transfer.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            transfer.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          transfer.tracking.push(track);
          transfer.approvalStage = stagesOfApproval.STAGE1
          transfer.nextApprovalOfficer = AO[0].id
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          return Promise.resolve({
            message:"Rejected",
            transfer
          })
        }
      }else {
        if(transfer?.approvalStage == stagesOfApproval.START){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = transfer.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            transfer.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            })
          }
          //@ts-ignore
          transfer.tracking.push(track)
          transfer.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          transfer.nextApprovalOfficer = data.nextApprovalOfficer
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          return Promise.resolve({
            message:"Approved",
            transfer
          })
        }else if(transfer?.approvalStage == stagesOfApproval.STAGE1){
          let track = {
            title:"Initiate Transfer",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          // console.log(track);
          let checkOfficer = transfer.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            transfer.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          //@ts-ignore
          transfer.tracking.push(track)
          transfer.approvalStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          transfer.nextApprovalOfficer = data.nextApprovalOfficer
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          return Promise.resolve({
            message:"Approved",
            transfer
          })
        } else if(transfer?.approvalStage == stagesOfApproval.STAGE2){
          let track = {
            title:"Initiate Transfer",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = transfer.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            transfer.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          transfer.tracking.push(track)
          transfer.approvalStage = stagesOfApproval.APPROVED;
          transfer.transferStatus = TransferStatus.COMPLETED
          //@ts-ignore
          transfer.nextApprovalOfficer = data.nextApprovalOfficer
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          return Promise.resolve({
            message:"Approved",
            transfer
          })
        }
      }

    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchTransferRequets(query:QueryInterface):Promise<TransferRequestPool|undefined>{
    try {
      const transfers = await this.transfer.find(query);
      let totalApproved = transfers.filter(
          transfer=>transfer.transferStatus == TransferStatus.COMPLETED
        );
      let totalPending = transfers.filter(
        transfer=>transfer.transferStatus == TransferStatus.PENDING
      );
      return Promise.resolve({
        transfer:transfers,
        counts:{
          totalApproved:totalApproved.length | 0,
          totalPending:totalPending.length | 0,
          totalTransfers:transfers.length | 0
        }
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchTransferDetails(id:string):Promise<TransferCylinder|undefined>{
    try {
      const transfer = await this.transfer.findById(id);
      return Promise.resolve(transfer as TransferCylinder);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchUserPendingApproval(query:QueryInterface, user:UserInterface):Promise<TransferCylinder[]|undefined>{
    try {
      const transfers = await this.transfer.find(query);
      let pendingTransfers = transfers.filter(transfer=>transfer.transferStatus == TransferStatus.PENDING);
      let startStage = pendingTransfers.filter(transfer=> {
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
      let stage1 = pendingTransfers.filter(transfer=>{
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
      let stage2 = pendingTransfers.filter(transfer=>{
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

  public async deleteRegisteredCylinder(id:string, user:UserInterface):Promise<any>{
    try {
      const cylinder = await this.cylinder.findById(id);
      if(!cylinder) {
        throw new BadInputFormatException('This cylinder was not found');
      }
      await cylinder.remove();
      return Promise.resolve({
        message:'Cylinder deleted'
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomerCylinders(customerId:string):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      //@ts-ignore
      const cylinders = await this.registerCylinder.find({assignedTo:customerId});
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e)
    }
  }

}

export default Cylinder;
