import { compareSync } from "bcryptjs";
import { Model, Schema, Types } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ArchivedCylinder } from "../../models/archiveCylinder";
import { CylinderCondition, CylinderInterface, cylinderTypes } from "../../models/cylinder";
import { DisburseProduct, DisburseProductInterface } from "../../models/disburseStock";
import { cylinderHolder, RegisteredCylinderInterface, TypesOfCylinders } from "../../models/registeredCylinders";
import { ApprovalStatus, stagesOfApproval, TransferCylinder, TransferStatus, TransferType } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";
import Notify from '../../util/mail';
import env from '../../configs/static';
import { createLog } from "../../util/logs";
import { WalkinCustomerStatus } from "../../models/walk-in-customers";
import { generateToken } from "../../util/token";
import { CondemnCylinderInterface } from "../../models/condemnCylinder";
import { ChangeCylinderInterface } from "../../models/change-cylinder";

type CylinderProps = {
  cylinder: Model<CylinderInterface>
  registerCylinder: Model<RegisteredCylinderInterface>
  transfer: Model<TransferCylinder>
  archive:Model<ArchivedCylinder>
  user:Model<UserInterface>
  condemn:Model<CondemnCylinderInterface>
  change_gas:Model<ChangeCylinderInterface>
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

interface UpdateRegisteredCylinder {
  cylinderType?:RegisteredCylinderInterface['cylinderType'],
  waterCapacity?:RegisteredCylinderInterface['waterCapacity'],
  dateManufactured?:RegisteredCylinderInterface['dateManufactured'],
  assignedTo?:RegisteredCylinderInterface['assignedTo'],
  gasType?:RegisteredCylinderInterface['gasType'],
  standardColor?:RegisteredCylinderInterface['standardColor'],
  assignedNumber?:RegisteredCylinderInterface['assignedNumber'],
  testingPresure?:RegisteredCylinderInterface['testingPresure'],
  fillingPreasure?:RegisteredCylinderInterface['fillingPreasure'],
  gasVolumeContent?:RegisteredCylinderInterface['gasVolumeContent'],
  cylinderNumber?:RegisteredCylinderInterface['cylinderNumber'],
  cylinderId:string
}

type ReturningCylinderInterface = {
  cylinders:Schema.Types.ObjectId[]
}

interface CylinderCountInterface{
  totalCylinders:number,
  totalBufferCylinders:number,
  totalAssignedCylinders:number
}

interface FetchCylinderInterface {
  cylinders:CylinderInterface[]
}

interface TransferCylinderInput {
  cylinders:TransferCylinder['cylinders']
  to?:TransferCylinder['to']
  type:TransferCylinder['type']
  comment:string
  nextApprovalOfficer?:TransferCylinder['nextApprovalOfficer'],
  holdingTime?:number
  purchasePrice?:TransferCylinder['purchasePrice']
  purchaseDate?:TransferCylinder['purchaseDate']
  toBranch?:TransferCylinder['toBranch']
  toDepartment?:TransferCylinder['toDepartment']
}

interface ApprovalResponse{
  message:string
  transfer:TransferCylinder
}

type CylinderPoolStats = {
  bufferCylinder:number,
  assignedCylinder:number,
  withCustomer:number,
  withAsnl:number,
  customerBufferCylinders:number,
  customerAssignedCylinders:number,
  asnlBufferCylinders:number,
  asnlAssignedCylinders:number,
  asnlFilledCylinders:number,
  asnlEmptyCylinders:number,
  filledBufferCylinders:number,
  filledAssignedCylinders:number,
  emptyBufferCylinders:number,
  emptyAssignedCylinders:number
}

export interface ApprovalInput{
  comment:string,
  status:string,
  id:string,
  nextApprovalOfficer?:string,
  password:string,
  products?:DisburseProductInterface['products'],
  gasType?:TransferCylinder['gasType']
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

interface CondemnCylinder{
  cylinders:TransferCylinder['cylinders']
}

interface CylinderChangeApproval{
  status:string,
  changeId:string,
  password:string,
  comment:string,
  assignedTo:string
}

interface CondemnCylinderInput{
  cylinders:CondemnCylinderInterface['cylinders'],
  comment:string
}

interface ChangeGasTypeInput {
  cylinders:ChangeCylinderInterface['cylinders'],
  comment:string,
  gasType:string,
  cylinderType:string
}

interface ApproveCondemn {
  status:string,
  comment:string,
  password:string,
  condemnId:string
}

interface ArchivedCylinderResponse {
  message:string,
  skipped:CondemnCylinder['cylinders']
}

interface FilterCylinderResponse {
  faulty:RegisteredCylinderInterface[]
}

interface RegisteredCylinderPoolInterface {
  cylinders:RegisteredCylinderInterface[],
  counts:CylinderCountInterface
}


class Cylinder extends Module {
  private cylinder:Model<CylinderInterface>
  private registerCylinder:Model<RegisteredCylinderInterface>
  private transfer: Model<TransferCylinder>
  private archive: Model<ArchivedCylinder>
  private user: Model<UserInterface>
  private condemn:Model<CondemnCylinderInterface>
  private change_gas:Model<ChangeCylinderInterface>

  constructor(props:CylinderProps) {
    super()
    this.cylinder = props.cylinder
    this.registerCylinder = props.registerCylinder
    this.transfer = props.transfer
    this.archive = props.archive
    this.user = props.user
    this.condemn = props.condemn
    this.change_gas = props.change_gas
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
      await createLog({
        user:user._id,
        activities:{
          title:'Cylinder type',
          //@ts-ignore
          activity:`You added a new cylinder type`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(newGas);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchCylinders(query:QueryInterface): Promise<FetchCylinderInterface|undefined>{
    try {
      //@ts-ignore
      const cylinders = await this.cylinder.find({},{...query});
      // let bufferCylinders = cylinders.docs.filter(cylinder=> cylinder.type == cylinderTypes.BUFFER);
      // let assignedCylinders = cylinders.docs.filter(cylinder=> cylinder.type == cylinderTypes.ASSIGNED);
      return Promise.resolve({
        cylinders
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
    try {
      let foundCylinder
      if(data.cylinderNumber) {
        foundCylinder = await this.registerCylinder.findOne({cylinderNumber:data.cylinderNumber});
      }else if(data.assignedNumber) {
        foundCylinder = await this.registerCylinder.findOne({assignedNumber:data.assignedNumber});
      }
      if(foundCylinder) {
        throw new BadInputFormatException('this cylinder has been registered');
      }
      let manDate = new Date(data.dateManufactured);
      if(data.cylinderType == TypesOfCylinders.BUFFER) {
        let pref = "ASNL"
        let num = await generateToken(6);
        //@ts-ignore
        data.cylinderNumber = pref + num.toString();
      }else if(data.cylinderType == TypesOfCylinders.ASSIGNED){
        let pref = "CYL"
        let num = await generateToken(6);
        //@ts-ignore
        data.assignedNumber = pref + num.toString();
      }
      let payload = {
        ...data,
        dateManufactured:manDate.toISOString(),
        branch:user.branch
      }
      let newRegistration:NewCylinderRegisterationInterface|undefined = await this.registerCylinder.create(payload);
      await createLog({
        user:user._id,
        activities:{
          title:'Register Cylinder',
          //@ts-ignore
          activity:`You registered a new ${newRegistration.cylinderType} cylinder`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(newRegistration as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async updateRegCylinder(data:UpdateRegisteredCylinder, user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(data.cylinderId)
      if(!cylinder) {
        throw new BadInputFormatException('cylinder not found');
      }
      let updatedCyliner = await this.registerCylinder.findByIdAndUpdate(
        cylinder._id,
        {
          $set:data
        },
        {new:true}
      )
      return Promise.resolve(updatedCyliner as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async changeGasType(data:ChangeGasTypeInput, user:UserInterface):Promise<ChangeCylinderInterface|undefined>{
    try {
      const change = new this.change_gas({...data, branch:user.branch, initiator:user._id});
      let hod = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.branch});
      change.nextApprovalOfficer = hod?._id
      let track = {
        title:"Condemn cylinders",
        stage:stagesOfApproval.STAGE1,
        status:ApprovalStatus.APPROVED,
        dateApproved:new Date().toISOString(),
        approvalOfficer:user._id,
        nextApprovalOfficer:hod?._id
      }
      //@ts-ignore
      change.tracking.push(track);
      change.approvalOfficers.push({
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
      change.comments.push(com);
      await change.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Cylinder Change',
          activity:`You started a new cylinder Change process`,
          time: new Date().toISOString()
        }
      });
      await new Notify().push({
        subject: "New cylinder condemation approval",
        content: `A cylinder type change has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
        user: hod
      });
      return Promise.resolve(change);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async approveCylinderChange(data:CylinderChangeApproval, user:UserInterface) :Promise<ChangeCylinderInterface|undefined>{
    try {
      let loginUser = await this.user.findById(user._id).select('+password');
      let matchPWD = await loginUser?.comparePWD(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      let change = await this.change_gas.findById(data.changeId).populate(
        [
          {path:'initiator', model:'User'}
        ]
      );
      if(!change){
        throw new BadInputFormatException('cylinder change request not found');
      }
      if(data.status == ApprovalStatus.REJECTED) {
        if(change?.approvalStage == stagesOfApproval.STAGE1){
          let AO = change.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = change.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            change.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          change.tracking.push(track)
          change.approvalStage = stagesOfApproval.START
          change.nextApprovalOfficer = AO[0].id
          change.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await change.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Change',
              //@ts-ignore
              activity:`You Rejected a Cylinder Change request from ${change.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(change.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Change",
            content: `A Cylinder Change you initiated has been rejected, check it and try again. click to view ${env.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
            user: apUser
          });
          return Promise.resolve(change)
        }else if(change?.approvalStage == stagesOfApproval.STAGE2) {
          let AO = change.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = change.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            change.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          change.tracking.push(track);
          change.approvalStage = stagesOfApproval.STAGE1
          change.nextApprovalOfficer = AO[0].id
          change.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await change.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Change',
              //@ts-ignore
              activity:`You Rejected a Cylinder Change request from ${change.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(change.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Change",
            content: `A Cylinder Change you approved has been rejected. check and try again. click to view ${env.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
            user: apUser
          });
          return Promise.resolve(change)
        }
      }else {
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        // console.log(hod);
        if(change?.approvalStage == stagesOfApproval.START){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:hod?._id
          }
          let checkOfficer = change.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            change.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            });
          }
          //@ts-ignore
          change.tracking.push(track)
          change.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          change.nextApprovalOfficer = hod?._id;
          change.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await change.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Change',
              //@ts-ignore
              activity:`You Approved a Cylinder Change request from ${change.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(change.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Change",
            content: `A Cylinder Change has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
            user: apUser
          });
          return Promise.resolve(change)
        }else if(change?.approvalStage == stagesOfApproval.STAGE1){
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
          let checkOfficer = change.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            change.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          //@ts-ignore
          change.tracking.push(track)
          change.approvalStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          change.nextApprovalOfficer = hod?.branch.branchAdmin;
          change.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await change.save();
          // console.log(transfer)
          // let logMan = condem.initiator;
          // console.log(logMan);
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Change',
              //@ts-ignore
              activity:`You Approved a Cylinder Change request from ${change.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(change.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Change",
            content: `A Cylinder Change has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
            user: apUser
          });
          return Promise.resolve(change)
        } else if(change?.approvalStage == stagesOfApproval.STAGE2){
          let track = {
            title:"Initiate Transfer",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            // nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = change.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            change.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          change.tracking.push(track)
          change.approvalStage = stagesOfApproval.APPROVED;
          change.approvalStatus = TransferStatus.COMPLETED
          //@ts-ignore
          // change.nextApprovalOfficer = data.nextApprovalOfficer
          change.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Change',
              //@ts-ignore
              activity:`You Approved a Cylinder Change request from ${change.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(change.initiator);
          await new Notify().push({
            subject: "New Cylinder Change",
            content: `A Cylinder Change you initiated has been approved to view ${env.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
            user: apUser
          });
          let cylinders = change.cylinders
          for(let cyl of cylinders) {
            let changeCyl = await this.registerCylinder.findById(cyl);
            //@ts-ignore
            changeCyl?.gasType = change.gasType;
            //@ts-ignore
            changeCyl?.cylinderType = change.cylinderType;
            if(changeCyl?.cylinderType == TypesOfCylinders.ASSIGNED) {
              changeCyl.assignedTo = change.assignedTo
            }
            await changeCyl?.save();
          }
          await change.save();
          return Promise.resolve(change)
        }
      }
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchChangeCylinderRequests(query:QueryInterface, user:UserInterface):Promise<ChangeCylinderInterface[]|undefined>{
    try {
      //@ts-ignore
      const changes = await this.change_gas.paginate({branch:user.branch}, {...query});
      // console.log(changes)
      return changes
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchPendingChangeRequest(query:QueryInterface, user:UserInterface):Promise<ChangeCylinderInterface[]|undefined>{
    try {
      const change_requests = await this.change_gas.find({
        branch:user.branch,
        approvaStatus:TransferStatus.PENDING,
        nextApprovalOfficer:user._id
      }, {...query});
      return change_requests;
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchChangeCylinderDetails(cylinderId:string):Promise<ChangeCylinderInterface|undefined> {
    try {
      const cylinder = await this.change_gas.findById(cylinderId).populate([
        {path:'cylinders', model:'registered-cylinders'},
        {path:'nextApprovalOfficer', model:'User'},
        {path:'initiator', model:'User'},
        {path:'gasType', model:'cylinder'},
        {path:'branch', model:'branches'},
        {path:'assignedTo', model:'customer'}
      ]);

      return Promise.resolve(cylinder as ChangeCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchRegisteredCylinders(query:QueryInterface, user:UserInterface):Promise<RegisteredCylinderPoolInterface|undefined>{
    try {
      let options = {
        ...query,
        populate:[
          {path:'assignedTo', model:'customer'},
          {path:'branch', model:'branches'},
          {path:'gasType', model:'cylinder'}
        ]
      }
      //@ts-ignore
      const registeredCylinders = await this.registerCylinder.paginate({ branch:user.branch },options);
      //@ts-ignore
      const cylinders = await this.registerCylinder.find({});
      const bufferCylinders = cylinders.filter(cylinder=> cylinder.cylinderType == cylinderTypes.BUFFER);
      //@ts-ignore
      const assignedCylinders = cylinders.filter(cylinder=> cylinder.cylinderType == cylinderTypes.ASSIGNED);
      return Promise.resolve({
        cylinders:registeredCylinders,
        counts:{
          totalCylinders:cylinders.length|0,
          totalBufferCylinders:bufferCylinders.length|0,
          totalAssignedCylinders:assignedCylinders.length|0
        }
      });
    } catch (e) {
      this.handleException(e);
    };
  }

  public async fetchRegisteredCylindersNoP(query:QueryInterface, user:UserInterface):Promise<RegisteredCylinderInterface[]|undefined>{
    try{
      const cylinders = await this.registerCylinder.find({...query, branch:user.branch}).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'},
        {path:'gasType', model:'cylinder'},
      ]);
      return Promise.resolve(cylinders);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchRegisteredCylinder(id:string,user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(id).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'},
        {path:'gasType', model:'cylinder'},
        {path:'toBranch', model:'branches'}
      ]);
      return Promise.resolve(cylinder as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderStats(user:UserInterface):Promise<CylinderPoolStats|undefined>{
    try {
      const cylinders = await this.registerCylinder.find({branch:user.branch});
      const bufferCylinder = cylinders.filter(cylinder=> cylinder.cylinderType == TypesOfCylinders.BUFFER).length;
      const assignedCylinder = cylinders.filter(cylinder=> cylinder.cylinderType == TypesOfCylinders.ASSIGNED).length;
      const withCustomer = cylinders.filter(cylinder=> cylinder.holder == cylinderHolder.CUSTOMER).length;
      const withAsnl = cylinders.filter(cylinder=> cylinder.holder == cylinderHolder.ASNL).length;

      const customerBufferCylinders = cylinders.filter(cylinder=>
          cylinder.holder == cylinderHolder.CUSTOMER && cylinder.cylinderType == TypesOfCylinders.BUFFER).length;
      const customerAssignedCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.CUSTOMER && cylinder.cylinderType == TypesOfCylinders.ASSIGNED).length;

      const asnlBufferCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderType == TypesOfCylinders.BUFFER).length;
      const asnlAssignedCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderType == TypesOfCylinders.ASSIGNED).length;

      const asnlFilledCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderStatus == WalkinCustomerStatus.FILLED).length;

      const asnlEmptyCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderStatus == WalkinCustomerStatus.EMPTY).length;

      const filledBufferCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderStatus == WalkinCustomerStatus.FILLED && cylinder.cylinderType == TypesOfCylinders.BUFFER).length;

      const filledAssignedCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderStatus == WalkinCustomerStatus.FILLED && cylinder.cylinderType == TypesOfCylinders.ASSIGNED).length;

      const emptyBufferCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderStatus == WalkinCustomerStatus.FILLED && cylinder.cylinderType == TypesOfCylinders.BUFFER).length;

      const emptyAssignedCylinders = cylinders.filter(cylinder=>
        cylinder.holder == cylinderHolder.ASNL && cylinder.cylinderStatus == WalkinCustomerStatus.FILLED && cylinder.cylinderType == TypesOfCylinders.ASSIGNED).length;

      return Promise.resolve({
        bufferCylinder,
        assignedCylinder,
        withCustomer,
        withAsnl,
        customerBufferCylinders,
        customerAssignedCylinders,
        asnlBufferCylinders,
        asnlAssignedCylinders,
        asnlFilledCylinders,
        asnlEmptyCylinders,
        filledBufferCylinders,
        filledAssignedCylinders,
        emptyBufferCylinders,
        emptyAssignedCylinders
      })

    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderTransferStats(user:UserInterface):Promise<any>{
    try {
      const cylinders = await this.transfer.find({branch:user.branch});
      //@ts-ignore
      const approvedTransfers = cylinders.filter(cylinder=> cylinder.approvalStatus == TransferStatus.COMPLETED).length;
      //@ts-ignore
      const pendingTransfers = cylinders.filter(cylinder=> cylinder.approvalStatus == TransferStatus.PENDING).length;
      return Promise.resolve({
        all_transfers:cylinders.length | 0,
        approvedTransfers:approvedTransfers | 0,
        pendingTransfers:pendingTransfers | 0
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchFaultyCylinders(query:QueryInterface, user:UserInterface):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      let options = {
        ...query,
        populate:[
          {path:'assignedTo', model:'customer'},
          {path:'branch', model:'branches'},
          {path:'gasType', model:'cylinder'},
        ]
      }
      //@ts-ignore
      const cylinders = await this.registerCylinder.paginate({branch:user.branch, condition:CylinderCondition.FAULTY}, options);
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async condemnCylinder(data:CondemnCylinder):Promise<ArchivedCylinderResponse|undefined>{
    try {
      let skipped = []
      for(let cyl of data.cylinders){
        const cylinder = await this.registerCylinder.findById(cyl);
        if(!cylinder) {
          skipped.push(cyl);
        }
      const saveInfo = {
        cylinderType: cylinder?.cylinderType,
        condition: CylinderCondition.DAMAGED,
        waterCapacity: cylinder?.waterCapacity,
        dateManufactured: cylinder?.dateManufactured,
        assignedTo: cylinder?.assignedTo,
        gasType: cylinder?.gasType,
        standardColor: cylinder?.standardColor,
        testingPresure: cylinder?.testingPresure,
        fillingPreasure: cylinder?.fillingPreasure,
        gasVolumeContent: cylinder?.gasVolumeContent,
        cylinderNumber: cylinder?.cylinderNumber,
        branch: cylinder?.branch
      }
      await this.archive.create(saveInfo);
      await cylinder?.remove();
      }
      return Promise.resolve({
        message:'archived cylinders',
        skipped
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async condemingCylinders(data:CondemnCylinderInput, user:UserInterface):Promise<CondemnCylinderInterface|undefined>{
    try {
      const condemn = new this.condemn({
        ...data,
        branch:user.branch,
        initiator:user._id
      });
      let hod = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.branch});
      condemn.nextApprovalOfficer = hod?._id
      let track = {
        title:"Condemn cylinders",
        stage:stagesOfApproval.STAGE1,
        status:ApprovalStatus.APPROVED,
        dateApproved:new Date().toISOString(),
        approvalOfficer:user._id,
        nextApprovalOfficer:hod?._id
      }
      //@ts-ignore
      condemn.tracking.push(track)
      condemn.approvalOfficers.push({
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
      condemn.comments.push(com);
      await condemn.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Cylinder Condemn',
          activity:`You started a new cylinder condemn process`,
          time: new Date().toISOString()
        }
      });
      await new Notify().push({
        subject: "New cylinder condemation approval",
        content: `A cylinder condemnation has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-condemn-details/${condemn._id}`,
        user: hod
      });
      return Promise.resolve(condemn);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async approveCondemnation(data:ApproveCondemn, user:UserInterface):Promise<CondemnCylinderInterface|undefined>{
    try {
      let loginUser = await this.user.findById(user._id).select('+password');
      let matchPWD = await loginUser?.comparePWD(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      let condem = await this.condemn.findById(data.condemnId).populate(
        [
          {path:'initiator', model:'User'}
        ]
      );
      if(!condem){
        throw new BadInputFormatException('cylinder condemn request not found');
      }
      if(data.status == ApprovalStatus.REJECTED) {
        if(condem?.approvalStage == stagesOfApproval.STAGE1){
          let AO = condem.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = condem.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
           condem.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          condem.tracking.push(track)
          condem.approvalStage = stagesOfApproval.START
          condem.nextApprovalOfficer = AO[0].id
          condem.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await condem.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Condemnnation',
              //@ts-ignore
              activity:`You Rejected a Cylinder Condemnnation request from ${condem.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(condem.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Condemnnation",
            content: `A Cylinder Condemnnation you initiated has been rejected, check it and try again. click to view ${env.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
            user: apUser
          });
          return Promise.resolve(condem)
        }else if(condem?.approvalStage == stagesOfApproval.STAGE2) {
          let AO = condem.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
          let track = {
            title:"Approval Process",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.REJECTED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:AO[0].id
          }
          let checkOfficer = condem.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            condem.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          //@ts-ignore
          condem.tracking.push(track);
          condem.approvalStage = stagesOfApproval.STAGE1
          condem.nextApprovalOfficer = AO[0].id
          condem.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await condem.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Condemnnation',
              //@ts-ignore
              activity:`You Rejected a Cylinder Condemnnation request from ${condem.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(condem.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Condemnnation",
            content: `A Cylinder Condemnnation you approved has been rejected. check and try again. click to view ${env.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
            user: apUser
          });
          return Promise.resolve(condem)
        }
      }else {
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        // console.log(hod);
        if(condem?.approvalStage == stagesOfApproval.START){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:hod?._id
          }
          let checkOfficer = condem.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            condem.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            });
          }
          //@ts-ignore
          condem.tracking.push(track)
          condem.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          condem.nextApprovalOfficer = hod?._id;
          condem.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await condem.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Condemnnation',
              //@ts-ignore
              activity:`You Approved a Cylinder Condemnnation request from ${condem.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(condem.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Condemnnation",
            content: `A Cylinder Condemnnation has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
            user: apUser
          });
          return Promise.resolve(condem)
        }else if(condem?.approvalStage == stagesOfApproval.STAGE1){
          // console.log(condem)
          let track = {
            title:"Condemn cylinder",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            //@ts-ignore
            nextApprovalOfficer:hod?.branch.branchAdmin
          }
          // console.log(track);
          let checkOfficer = condem.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            condem.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          //@ts-ignore
          condem.tracking.push(track)
          condem.approvalStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          condem.nextApprovalOfficer = hod?.branch.branchAdmin;
          condem.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await condem.save();
          // console.log(transfer)
          // let logMan = condem.initiator;
          // console.log(logMan);
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Condemnnation',
              //@ts-ignore
              activity:`You Approved a Cylinder Condemnnation request from ${condem.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(condem.nextApprovalOfficer);
          await new Notify().push({
            subject: "New Cylinder Condemnnation",
            content: `A Cylinder Condemnnation has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
            user: apUser
          });
          return Promise.resolve(condem)
        } else if(condem?.approvalStage == stagesOfApproval.STAGE2){
          let track = {
            title:"condemn cylinder",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            // nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = condem.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0){
            condem.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          // console.log(track)
          //@ts-ignore
          condem.tracking.push(track)
          // console.log(condem)
          condem.approvalStage = stagesOfApproval.APPROVED;
          condem.approvalStatus = TransferStatus.COMPLETED
          //@ts-ignore
          // condem.nextApprovalOfficer = data.nextApprovalOfficer
          condem.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Condemnnation',
              //@ts-ignore
              activity:`You Approved a Cylinder Condemnnation request from ${condem.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(condem.initiator);
          await new Notify().push({
            subject: "Cylinder Condemnation",
            content: `A Cylinder Condemnnation you initiated has been approved to view ${env.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
            user: apUser
          });
          let cylinders = condem.cylinders;
          await this.condemnCylinder({cylinders});
          await condem.save();
          return Promise.resolve(condem)
        }
      }
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchCondemnCylinderRequests(query:QueryInterface, user:UserInterface):Promise<CondemnCylinderInterface[]|undefined>{
    try {
      //@ts-ignore
      const requests = await this.condemn.paginate({branch:user.branch}, {...query});
      return requests;
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchPendingCondemnRequests(query:QueryInterface, user:UserInterface):Promise<CondemnCylinderInterface[]|undefined>{
    try {
      //@ts-ignore
      const requests = await this.condemn.paginate({
        branch:user.branch,
        approvaStatus:TransferStatus.PENDING,
        nextApprovalOfficer:user._id}, {...query});
      return requests;
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCondemnationDetatils(condemnId:string):Promise<CondemnCylinderInterface|undefined>{
    try {
      const request = await this.condemn.findById(condemnId).populate([
        {path:'cylinders', model:'registered-cylinders'},
        {path:'initiator', model:'User'},
        {path:'nextApprovalOfficer', model:'User'},
        {path:'branch', model:'branches'}
      ]);
      return Promise.resolve(request as CondemnCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchArchivedCylinder(query:QueryInterface, user:UserInterface):Promise<ArchivedCylinder[]|undefined>{
    try {
      let options = {
        ...query,
        options:[
          {path:'assignedTo', model:'customer'},
          {path:'branch', model:'branches'}
        ]
      }
      //@ts-ignore
      const cylinders = await this.archive.paginate({branch:user.branch}, options);
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async transferCylinders(data:TransferCylinderInput, user:UserInterface):Promise<TransferCylinder|undefined>{
    try {
      const date = new Date();
      if(data.holdingTime) {
        date.setDate(date.getDate() + data.holdingTime);
         //@ts-ignore
        data?.holdingTime = date.toISOString()
      }
      let transfer = new this.transfer({...data, branch:user.branch});
      transfer.initiator = user._id;
      let hod = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.branch});
      transfer.nextApprovalOfficer = hod?._id;
      let track = {
        title:"Initiate Transfer",
        stage:stagesOfApproval.STAGE1,
        status:ApprovalStatus.APPROVED,
        dateApproved:new Date().toISOString(),
        approvalOfficer:user._id,
        nextApprovalOfficer:hod?._id
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
      await transfer.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Cylinder transfer',
          //@ts-ignore
          activity:`You started a new cylinder transfer process`,
          time: new Date().toISOString()
        }
      });
      await new Notify().push({
        subject: "New cylinder transfer",
        content: `A cylinder transfer has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
        user: hod
      });
      return Promise.resolve(transfer);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveTransfer(data:ApprovalInput, user:UserInterface):Promise<ApprovalResponse|undefined>{
    try {
      let loginUser = await this.user.findById(user._id).select('+password');
      let matchPWD = await loginUser?.comparePWD(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      let transfer = await this.transfer.findById(data.id).populate(
        [
          {path:'initiator', model:'User'}
        ]
      );
      if(!transfer){
        throw new BadInputFormatException('cylinder transfer not found');
      }
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
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Transfer',
              //@ts-ignore
              activity:`You Rejected a cylinder transfer request from ${transfer.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(transfer.nextApprovalOfficer);
          await new Notify().push({
            subject: "New cylinder transfer",
            content: `A cylinder transfer you initiated has been rejected, check it and try again. click to view ${env.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
            user: apUser
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Transfer',
              //@ts-ignore
              activity:`You Rejected a cylinder transfer request from ${transfer.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(transfer.nextApprovalOfficer);
          await new Notify().push({
            subject: "New cylinder transfer",
            content: `A cylinder transfer you approved has been rejected. check and try again. click to view ${env.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
            user: apUser
          });
          return Promise.resolve({
            message:"Rejected",
            transfer
          })
        }
      }else {
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        // console.log(hod);
        if(transfer?.approvalStage == stagesOfApproval.START){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:hod?._id
          }
          let checkOfficer = transfer.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            transfer.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            });
          }
          //@ts-ignore
          transfer.tracking.push(track)
          transfer.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          transfer.nextApprovalOfficer = hod?._id;
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Transfer',
              //@ts-ignore
              activity:`You Approved a cylinder transfer request from ${transfer.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(transfer.nextApprovalOfficer);
          await new Notify().push({
            subject: "New cylinder transfer",
            content: `A cylinder transfer has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
            user: apUser
          });
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
            //@ts-ignore
            nextApprovalOfficer:hod?.branch.branchAdmin
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
          transfer.nextApprovalOfficer = hod?.branch.branchAdmin;
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await transfer.save();
          // console.log(transfer)
          // let logMan = transfer.initiator;
          // console.log(logMan);
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Transfer',
              //@ts-ignore
              activity:`You Approved a cylinder transfer request from ${transfer.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(transfer.nextApprovalOfficer);
          await new Notify().push({
            subject: "New cylinder transfer",
            content: `A cylinder transfer has been initiated and requires your approval click to view ${env.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
            user: apUser
          });
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
            // nextApprovalOfficer:data.nextApprovalOfficer
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
          // transfer.nextApprovalOfficer = data.nextApprovalOfficer
          transfer.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await createLog({
            user:user._id,
            activities:{
              title:'Cylinder Transfer',
              //@ts-ignore
              activity:`You Approved a cylinder transfer request from ${transfer.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(transfer.initiator);
          await new Notify().push({
            subject: "New cylinder transfer",
            content: `A Cylinder transfer you initiated has been approved to view ${env.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
            user: apUser
          });
          let cylinders = transfer.cylinders
          if(transfer.type == TransferType.TEMPORARY || transfer.type == TransferType.PERMANENT){
            for(let cylinder of cylinders) {
              let cyl = await this.registerCylinder.findById(cylinder);
              //@ts-ignore
              cyl?.assignedTo = transfer.to;
              //@ts-ignore
              cyl?.holder = cylinderHolder.CUSTOMER
              //@ts-ignore
              cyl?.cylinderType = TypesOfCylinders.ASSIGNED;
              if(transfer.type == TransferType.TEMPORARY){
                //@ts-ignore
                cyl?.holdingTime = transfer.holdingTime;
              }
              await cyl?.save();
            }
          }else if(transfer.type == TransferType.DIVISION){
            for(let cylinder of cylinders) {
              let cyl = await this.registerCylinder.findById(cylinder);
              //@ts-ignore
              // cyl?.cylinderType = TypesOfCylinders.BUFFER;
              //@ts-ignore
              cyl?.department = transfer.toDepartment;

              await cyl?.save();
            }
          }else if(transfer.type == TransferType.CHANGEGAS){
            for(let cylinder of cylinders) {
              let cyl = await this.registerCylinder.findById(cylinder);
              //@ts-ignore
              cyl?.gasType = transfer.gasType;

              await cyl?.save();
            }
          }else if(transfer.type == TransferType.BRANCH){
            for(let cylinder of cylinders) {
              let cyl = await this.registerCylinder.findById(cylinder);
              //@ts-ignore
              cyl?.toBranch = transfer.toBranch;
              //@ts-ignore
              cyl?.holder = cylinderHolder.BRANCH
              await cyl?.save();
            }
          }
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

  public async returnCylinder(data:ReturningCylinderInterface, user:UserInterface):Promise<any>{
    try {
      for(let cylinder of data.cylinders ) {
        let cyl = await this.registerCylinder.findById(cylinder);
        //@ts-ignore
        cyl?.holder = cylinderHolder.ASNL;
        //@ts-ignore
        cyl?.toBranch = cyl?.branch;
        cyl?.save();
      }
      return Promise.resolve({
        message:'cylinders returned'
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async faultyCylinder(cylinderId:string, user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(cylinderId);
      if(!cylinder) {
        throw new BadInputFormatException('cylinder not found');
      }
      //@ts-ignore
      cylinder.condition = CylinderCondition.FAULTY;
      await cylinder?.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Cylinder Faulty',
          //@ts-ignore
          activity:`You marked ${cylinder.cylinderNumber | cylinder.assignedNumber} as a faulty cylinder`,
          time: new Date().toISOString()
        }
      });
      let apUser = await this.user.findOne({role:'production', subrole:'head of department', branch:cylinder.branch});
          await new Notify().push({
            subject: "Faulty cylinder",
            content: `A cylinder has been assigned as faulty and requires your attenction. click to view ${env.FRONTEND_URL}/registered-cylinder-details/${cylinder._id}`,
            user: apUser
          });
      return Promise.resolve(cylinder as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fixedFaultyCylinder(cylinderId:string, user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(cylinderId).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'},
        {path:'gasType', model:'cylinder'},
      ]);
      if(!cylinder) {
        throw new BadInputFormatException('cylinder not found');
      }
      //@ts-ignore
      cylinder.condition = CylinderCondition.GOOD;
      await cylinder?.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Cylinder Faulty',
          //@ts-ignore
          activity:`You marked ${cylinder.cylinderNumber | cylinder.assignedNumber} as a fixed cylinder`,
          time: new Date().toISOString()
        }
      });
      let apUser = await this.user.findOne({role:'sales', subrole:'head of department', branch:cylinder.branch});
          await new Notify().push({
            subject: "Faulty cylinder",
            content: `A faulty cylinder has been fixed. click to view ${env.FRONTEND_URL}/registered-cylinder-details/${cylinder._id}`,
            user: apUser
          });
      return Promise.resolve(cylinder as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchTransferRequets(query:QueryInterface, user:UserInterface):Promise<TransferRequestPool|undefined>{
    try {
      //@ts-ignore
      const transfers = await this.transfer.paginate({branch:user.branch},{...query});
      const transferReq= await this.transfer.find({})
      let totalApproved = transferReq.filter(
        //@ts-ignore
          transfer=>transfer.transferStatus == TransferStatus.COMPLETED
        );
      let totalPending = transferReq.filter(
        //@ts-ignore
        transfer=>transfer.transferStatus == TransferStatus.PENDING
      );
      return Promise.resolve({
        transfer:transfers,
        counts:{
          totalApproved:totalApproved.length | 0,
          totalPending:totalPending.length | 0,
          totalTransfers:transferReq.length | 0
        }
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchChangeCylinderRequest(query:QueryInterface, user:UserInterface):Promise<TransferCylinder|undefined>{
    try{
      //@ts-ignore
      const changeRequests = await this.transfer.paginate({branch:user.branch, type:TransferType.CHANGEGAS}, {...query});
      return Promise.resolve(changeRequests);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchTransferDetails(id:string):Promise<TransferCylinder|undefined>{
    try {
      const transfer = await this.transfer.findById(id).populate([
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'cylinders', model:'registered-cylinders'},
          {path:'assignedTo', model:'customer'},
          {path:'gasType', model:'cylinder'},
          {path:'branch', model:'branches'}
      ]);
      return Promise.resolve(transfer as TransferCylinder);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchUserPendingApproval(query:QueryInterface, user:UserInterface):Promise<TransferCylinder[]|undefined>{
    try {

      const options = {
        ...query,
        populate:[
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'cylinders', model:'registered-cylinders'},
          {path:'gasType', model:'cylinder'},
          {path:'branch', model:'branches'},
          {path:'to', model:'customer'}
        ]
      }
      //@ts-ignore
      const transfers = await this.transfer.paginate({
        branch:user.branch,
        transferStatus:TransferStatus.PENDING,
        nextApprovalOfficer:`${user._id}`
      },options);
      //@ts-ignore
      // let startStage = transfers.docs.filter(transfer=> {
      //   if(transfer.approvalStage == stagesOfApproval.START) {
      //     for(let tofficer of transfer.approvalOfficers) {
      //       if(`${tofficer.id}` == `${user._id}`){
      //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
      //           return transfer
      //         }
      //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
      //         return transfer
      //       }
      //     }
      //   }
      // });
      //@ts-ignore
      // let stage1 = transfers.filter(transfer=>{
      //   if(transfer.approvalStage == stagesOfApproval.STAGE1) {
      //     for(let tofficer of transfer.approvalOfficers) {
      //       if(`${tofficer.id}` == `${user._id}`){
      //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
      //           return transfer
      //         }
      //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
      //         return transfer
      //       }
      //     }
      //   }
      // });
      //@ts-ignore
      // let stage2 = transfers.filter(transfer=>{
      //   if(transfer.approvalStage == stagesOfApproval.STAGE2) {
      //     for(let tofficer of transfer.approvalOfficers) {
      //       if(`${tofficer.id}` == `${user._id}`){
      //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
      //           return transfer
      //         }
      //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
      //         return transfer
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
      return Promise.resolve(transfers)
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
      await createLog({
        user:user._id,
        activities:{
          title:'Registered cylinder',
          //@ts-ignore
          activity:`You deleted a registered cylinder`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve({
        message:'Cylinder deleted'
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomerCylinders(query:QueryInterface, customerId:string):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      let options = {
        ...query,
        populate:[
          {path:'gasType', model:'cylinder'},
          {path:'assignedTo', model:'customer'}
        ]
      }
      //@ts-ignore
      const cylinders = await this.registerCylinder.paginate({assignedTo:customerId}, options);
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchTransferReport(query:QueryInterface, user:UserInterface):Promise<TransferCylinder[]|undefined>{
    try {
      //@ts-ignore
      const transfers = await this.transfer.paginate({branch:user.branch, TransferStatus:`${TransferStatus.COMPLETED}`},{...query});
      //@ts-ignore
      // const completed = transfers.docs.filter(transfer=> transfer.transferStatus == `${TransferStatus.COMPLETED}`);
      return Promise.resolve(transfers);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderReturned(cylinderId:string):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(cylinderId);
      if(!cylinder) {
        throw new BadInputFormatException('this cylinder mat have been deleted');
      }
      cylinder.holder = cylinderHolder.ASNL
      await cylinder.save();
      return cylinder;
    } catch (e) {
      this.handleException(e)
    }
  }

}

export default Cylinder;
