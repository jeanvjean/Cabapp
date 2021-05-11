import {
Schema,
Connection,
Model,
Document
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, stagesOfApproval, TransferStatus } from './transferCylinder';


interface saleCylinder{
  noOfCylinders:number
  volume:string
  unitPrice:number
  amount:number
}


export interface SalesRequisitionInterface extends Document{
  customerName:string
  ecrNo:string
  date:Date
  cylinders:saleCylinder[]
  initiator:Schema.Types.ObjectId
  approvalStage:stagesOfApproval
  approvalOfficers:ApprovalOfficers[]
  branch:Schema.Types.ObjectId
  status:TransferStatus
  preparedBy:Schema.Types.ObjectId
  initiated:boolean
  nextApprovalOfficer:Schema.Types.ObjectId
}

const saleCylinderSchema = new Schema({
  noOfCylinders:Number,
  volume:String,
  unitPrice:Number,
  amount:Number
});

const salesReqSchema = new Schema({
  customerName:{type:String},
  ecrNo:{type:String},
  date:{type:Date},
  cylinders:[saleCylinderSchema],
  initiator:{type:Schema.Types.ObjectId, ref:'users'},
  approvalStage:{type:String, enum:Object.values(stagesOfApproval), default:stagesOfApproval.START},
  approvalOfficers:[ApprovalOfficerSchema],
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  status:{type:String, enum:Object.values(TransferStatus), default:TransferStatus.PENDING},
  preparedBy:{type:Schema.Types.ObjectId, ref:'users'},
  initiated:{type:Boolean, default:false},
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'users'}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<SalesRequisitionInterface>{
  return conn.model('sales-requisition', salesReqSchema);
};
