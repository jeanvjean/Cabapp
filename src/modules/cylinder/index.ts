import { compareSync } from "bcryptjs";
import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ArchivedCylinder } from "../../models/archiveCylinder";
import { CylinderCondition, CylinderInterface, cylinderTypes } from "../../models/cylinder";
import { DisburseProduct, DisburseProductInterface } from "../../models/disburseStock";
import { RegisteredCylinderInterface, TypesOfCylinders } from "../../models/registeredCylinders";
import { ApprovalStatus, stagesOfApproval, TransferCylinder, TransferStatus, TransferType } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";
import Notify from '../../util/mail';
import env from '../../configs/static';
import { createLog } from "../../util/logs";

type CylinderProps = {
  cylinder: Model<CylinderInterface>
  registerCylinder: Model<RegisteredCylinderInterface>
  transfer: Model<TransferCylinder>
  archive:Model<ArchivedCylinder>
  user:Model<UserInterface>
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
  cylinders:CylinderInterface[]
}

interface TransferCylinderInput {
  cylinders:TransferCylinder['cylinders']
  to:TransferCylinder['to']
  type:TransferCylinder['type']
  comment?:string
  nextApprovalOfficer?:TransferCylinder['nextApprovalOfficer'],
  holdingTime:number
  purchasePrice:TransferCylinder['purchasePrice']
  purchaseDate:TransferCylinder['purchaseDate']
  toBranch:TransferCylinder['toBranch']
  toDepartment:TransferCylinder['toDepartment']
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
  password:string,
  products?:DisburseProductInterface['products']
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

  constructor(props:CylinderProps) {
    super()
    this.cylinder = props.cylinder
    this.registerCylinder = props.registerCylinder
    this.transfer = props.transfer
    this.archive = props.archive
    this.user = props.user
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
      const cylinders = await this.cylinder.find(query);
      let bufferCylinders = cylinders.filter(cylinder=> cylinder.type == cylinderTypes.BUFFER);
      let assignedCylinders = cylinders.filter(cylinder=> cylinder.type == cylinderTypes.ASSIGNED);
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

  public async fetchRegisteredCylinders(query:QueryInterface, user:UserInterface):Promise<RegisteredCylinderPoolInterface|undefined>{
    try {
      const registeredCylinders = await this.registerCylinder.find({...query, branch:user.branch}).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'},
        {path:'gasType', model:'cylinder'}
      ]);
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
    };
  }

  public async fetchRegisteredCylinder(id:string,user:UserInterface):Promise<RegisteredCylinderInterface|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(id).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'},
        {path:'gasType', model:'cylinder'}
      ]);
      return Promise.resolve(cylinder as RegisteredCylinderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchFaultyCylinders(query:QueryInterface, user:UserInterface):Promise<FilterCylinderResponse|undefined>{
    try {
      const cylinders = await this.registerCylinder.find({...query, branch:user.branch}).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'}
      ]);
      const faulty = cylinders.filter(cylinder=> cylinder.condition == CylinderCondition.FAULTY);
      return Promise.resolve({
        faulty
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async condemnCylinder(cylinderId:string):Promise<ArchivedCylinder|undefined>{
    try {
      const cylinder = await this.registerCylinder.findById(cylinderId);
      if(!cylinder) {
        throw new BadInputFormatException('No cylinder found with this id');
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
        branch: cylinder.branch
      }
      const archive = await this.archive.create(saveInfo);
      await cylinder?.remove();
      return Promise.resolve(archive);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchArchivedCylinder(query:QueryInterface, user:UserInterface):Promise<ArchivedCylinder[]|undefined>{
    try {
      const cylinders = await this.archive.find({...query, branch:user.branch}).populate([
        {path:'assignedTo', model:'customer'},
        {path:'branch', model:'branches'}
      ]);
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async transferCylinders(data:TransferCylinderInput, user:UserInterface):Promise<TransferCylinder|undefined>{
    try {
      const date = new Date();
      date.setDate(date.getDate() + data.holdingTime);
      let transfer = new this.transfer({...data, branch:user.branch, holdingTime:date.toISOString()});
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
      let transfer = await this.transfer.findById(data.id).populate('initiator');
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
          }else if(transfer.type == TransferType.REPAIR){
            for(let cylinder of cylinders) {
              let cyl = await this.registerCylinder.findById(cylinder);
              //@ts-ignore
              cyl?.department = transfer.toDEPARTMENT;
              //@ts-ignore
              cyl?.condition = TransferType.REPAIR;

              await cyl?.save();
            }
          }else if(transfer.type == TransferType.BRANCH){
            for(let cylinder of cylinders) {
              let cyl = await this.registerCylinder.findById(cylinder);
              //@ts-ignore
              cyl?.branch = transfer.toBranch;
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
      const cylinder = await this.registerCylinder.findById(cylinderId);
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
      let pendingTransfers = transfers.filter(transfer=>transfer.transferStatus == TransferStatus.PENDING && transfer.branch == user.branch);
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

  public async fetchCustomerCylinders(customerId:string):Promise<RegisteredCylinderInterface[]|undefined>{
    try {
      //@ts-ignore
      const cylinders = await this.registerCylinder.find({assignedTo:customerId});
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchTransferReport(query:QueryInterface):Promise<TransferCylinder[]|undefined>{
    try {
      const transfers = await this.transfer.find(query);
      const completed = transfers.filter(transfer=> transfer.transferStatus == `${TransferStatus.COMPLETED}`);
      return Promise.resolve(completed);
    } catch (e) {
      this.handleException(e);
    }
  }

}

export default Cylinder;
