import {
Schema,
Connection,
Model,
Document
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, ApprovalStage, approvalStageShema, stagesOfApproval, TransferStatus } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { CustomerType } from './customer';

export interface saleCylinder{
  noOfCylinders?:number
  cylinderNumber?:string
  volume?:{
    value:number,
    unit:string
  }
  unitPrice?:number
  amount?:number,
  cyliderType?:string,
  id:Schema.Types.ObjectId
}


export interface SalesRequisitionInterface extends Document{
  customer:{
    name:string,
    email:string,
    id:Schema.Types.ObjectId
  }
  ecrNo:string
  date:Date
  cylinders:saleCylinder[]
  initiator:Schema.Types.ObjectId
  approvalStage:stagesOfApproval
  tracking:ApprovalStage[]
  approvalOfficers:ApprovalOfficers[]
  branch:Schema.Types.ObjectId
  status:TransferStatus
  preparedBy:Schema.Types.ObjectId
  initiated:boolean
  nextApprovalOfficer:Schema.Types.ObjectId
  cyliderType:string,
  type: CustomerType
  production_id:Schema.Types.ObjectId,
  purchase_id:Schema.Types.ObjectId
  invoice_id:Schema.Types.ObjectId,
  fcr_id:Schema.Types.ObjectId
}

export const saleCylinderSchema = new Schema({
  noOfCylinders:Number,
  cylinderNumber:String,
  volume:{
    value:Number,
    unit:String
  },
  unitPrice:Number,
  amount:Number,
  cylinderType:String
});

const salesReqSchema = new Schema({
  customer:{
    name:String,
    email:String,
    id:Schema.Types.ObjectId
  },
  ecrNo:{type:String},
  date:{type:Date},
  cylinders:[saleCylinderSchema],
  tracking:[approvalStageShema],
  initiator:{type:Schema.Types.ObjectId, ref:'User'},
  approvalStage:{type:String, enum:Object.values(stagesOfApproval), default:stagesOfApproval.START},
  approvalOfficers:[ApprovalOfficerSchema],
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  status:{type:String, enum:Object.values(TransferStatus), default:TransferStatus.PENDING},
  preparedBy:{type:Schema.Types.ObjectId, ref:'User'},
  initiated:{type:Boolean, default:false},
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  cyliderType:String,
  type:{type:String, enum:Object.values(CustomerType)},
  production_id:Schema.Types.ObjectId,
  purchase_id:Schema.Types.ObjectId,
  invoice_id:Schema.Types.ObjectId,
  fcr_id:Schema.Types.ObjectId
},{
  timestamps:true
});

salesReqSchema.plugin(mongoosePaginate);
salesReqSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<SalesRequisitionInterface>{
  return conn.model('sales-requisition', salesReqSchema);
};
