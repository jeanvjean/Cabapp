import {
Schema,
Document,
Connection,
Model
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, commentInterface, commentSchema, stagesOfApproval, TransferStatus } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { Priority } from './emptyCylinder';

enum productionStatus {
  PENDING="pending",
  FILLED="filled"
}

interface productionCylinder {
  cylinderNo:string
  volume:{
    value:number,
    unit:string
}
  type:string
  status:productionStatus
}

export interface ProductionScheduleInterface extends Document{
  customer?:Schema.Types.ObjectId
  productionNo:string
  ecrNo:string
  shift:string
  date:Date
  cylinders:Schema.Types.ObjectId[]
  comments:commentInterface[]
  quantityToFill:number
  volumeToFill:{
      value:number,
      unit:string
  }
  totalQuantity:number
  totalVolume:{
      value:number,
      unit:string
  }
  initiator:Schema.Types.ObjectId
  approvalOfficers:ApprovalOfficers[]
  nextApprovalOfficer:Schema.Types.ObjectId
  status:TransferStatus
  approvalStage:stagesOfApproval
  branch:Schema.Types.ObjectId
  produced?:boolean
  priority?:Priority
  initNum:number
  ecr?:Schema.Types.ObjectId
}

const productionCylinderSchema = new Schema({
  cylinderNo:String,
  volume:{
    value:Number,
    unit:String
},
  type:String,
  status:{type:String, enum:Object.values(productionStatus), default:productionStatus.PENDING}
});

const productionSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  productionNo:{type:String},
  ecrNo:{type:String},
  ecr:{type:Schema.Types.ObjectId, ref:'empty-cylinders'},
  shift:{type:String},
  date:{type:Date},
  cylinders:[{type:Schema.Types.ObjectId, ref:"registered-cylinders"}],
  quantityToFill:{type:Number},
  volumeToFill:{
    value:Number,
    unit:String
},
  totalQuantity:{type:Number},
  totalVolume:{
    value:Number,
    unit:String
},
  initiator:{type:Schema.Types.ObjectId, ref:'User'},
  approvalOfficers:[ApprovalOfficerSchema],
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  status:{type:String, enum:Object.values(TransferStatus), default:TransferStatus.PENDING},
  approvalStage:{type:String},
  comments:{type:[commentSchema]},
  produced:{type:Boolean, default:false},
  priority:{type:String, enum:Object.values(Priority), default:Priority.REGULAR},
  initNum:Number,
  branch:{type:Schema.Types.ObjectId, ref: 'branches'}
});

productionSchema.plugin(mongoosePaginate)
productionSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection) :Model<ProductionScheduleInterface>{
  return conn.model('production-schedule', productionSchema);
}
