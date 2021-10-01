import {
Schema,
Connection,
Model,
Document
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, ApprovalStage, approvalStageShema, stagesOfApproval, TransferStatus } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface saleCylinder{
  noOfCylinders:number
  volume:string
  unitPrice:number
  amount:number,
  cyliderType:string
}


export interface SalesRequisitionInterface extends Document{
  customerName:string
  ecrNo:string
  date:Date
  cylinders:Schema.Types.ObjectId[]
  initiator:Schema.Types.ObjectId
  approvalStage:stagesOfApproval
  tracking:ApprovalStage[]
  approvalOfficers:ApprovalOfficers[]
  branch:Schema.Types.ObjectId
  status:TransferStatus
  preparedBy:Schema.Types.ObjectId
  initiated:boolean
  nextApprovalOfficer:Schema.Types.ObjectId
}

export const saleCylinderSchema = new Schema({
  noOfCylinders:Number,
  volume:String,
  unitPrice:Number,
  amount:Number,
  cylinderType:String
});

const salesReqSchema = new Schema({
  customerName:{type:String},
  ecrNo:{type:String},
  date:{type:Date},
  cylinders:[{type:Schema.Types.ObjectId, ref:'registered-cylinders'}],
  tracking:[approvalStageShema],
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

salesReqSchema.plugin(mongoosePaginate);
salesReqSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<SalesRequisitionInterface>{
  return conn.model('sales-requisition', salesReqSchema);
};
