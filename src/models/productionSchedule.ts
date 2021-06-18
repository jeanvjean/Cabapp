import {
Schema,
Document,
Connection,
Model
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, commentInterface, commentSchema, stagesOfApproval, TransferStatus } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';

enum productionStatus {
  PENDING="pending",
  FILLED="filled"
}

interface productionCylinder {
  cylinderNo:string
  volume:string
  type:string
  status:productionStatus
}

export interface ProductionScheduleInterface extends Document{
  customer:Schema.Types.ObjectId
  productionNo:string
  ecrNo:string
  shift:string
  date:Date
  cylinders:productionCylinder[]
  comments:commentInterface[]
  quantityToFill:number
  volumeToFill:string
  totalQuantity:number
  totalVolume:string
  initiator:Schema.Types.ObjectId
  approvalOfficers:ApprovalOfficers[]
  nextApprovalOfficer:Schema.Types.ObjectId
  status:TransferStatus
  approvalStage:stagesOfApproval
  branch:Schema.Types.ObjectId
  produced?:boolean
}

const productionCylinderSchema = new Schema({
  cylinderNo:String,
  volume:String,
  type:String,
  status:{type:String, enum:Object.values(productionStatus), default:productionStatus.PENDING}
});

const productionSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  productionNo:{type:String},
  ecrNo:{type:String},
  shift:{type:String},
  date:{type:Date},
  cylinders:{type:[productionCylinderSchema]},
  quantityToFill:{type:Number},
  volumeToFill:{type:String},
  totalQuantity:{type:Number},
  totalVolume:{type:String},
  initiator:{type:Schema.Types.ObjectId, ref:'User'},
  approvalOfficers:[ApprovalOfficerSchema],
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  status:{type:String, enum:Object.values(TransferStatus), derfault:TransferStatus.PENDING},
  approvalStage:{type:String},
  comments:{type:[commentSchema]},
  produced:{type:Boolean, default:false}
});

productionSchema.plugin(mongoosePaginate)

export default function factory(conn:Connection) :Model<ProductionScheduleInterface>{
  return conn.model('production-schedule', productionSchema);
}
