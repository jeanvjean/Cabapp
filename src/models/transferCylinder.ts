import {
  Connection,
  Schema,
  Document,
  Model,
  model
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum stagesOfApproval {
  START="start",
  STAGE1="stage1",
  STAGE2="stage2",
  STAGE3="stage3",
  APPROVED="approved"
}

export enum TransferStatus{
  PENDING="pending",
  COMPLETED="completed"
}

export enum ApprovalStatus {
  APPROVED="approved",
  REJECTED="rejected"
}

export enum TransferType{
  PERMANENT="permanent",
  TEMPORARY="temporary",
  DIVISION="within-division",
  CONDEMN="condemn",
  REPAIR="repair",
  BRANCH="branch",
  CHANGEGAS="change-gas"
}

export interface ApprovalStage{
  title:string,
  stage:stagesOfApproval,
  status:ApprovalStatus,
  dateApproved?:Date
}

export interface ApprovalOfficers{
  name:string,
  id:Schema.Types.ObjectId
  office:string
  department:string,
  stageOfApproval:string
}

export interface commentInterface {
  comment:string,
  commentBy:Schema.Types.ObjectId
  officer?:string
}

export interface TransferCylinder extends Document {
  cylinders:Schema.Types.ObjectId[]
  initiator:Schema.Types.ObjectId
  to:Schema.Types.ObjectId
  tracking:ApprovalStage[]
  transferStatus:TransferStatus
  approvalStage:stagesOfApproval
  approvalOfficers:ApprovalOfficers[]
  comments:commentInterface[]
  nextApprovalOfficer:Schema.Types.ObjectId
  holdingTime:number
  type:TransferType
  purchaseDate:Date
  purchasePrice:number
  toBranch:Schema.Types.ObjectId
  toDepartment:string
  branch:Schema.Types.ObjectId
  gasType:Schema.Types.ObjectId
  createdAt:Date,
  updatedAt:Date,
}

export const commentSchema = new Schema({
  comment:{type:String},
  commentBy:{type:Schema.Types.ObjectId, ref:'User'},
  officer:{type:String}
},{
  timestamps:true
});

export const approvalStageShema = new Schema({
  title:{type:String},
  stage:{type:String, enum:Object.values(stagesOfApproval)},
  status:{type:String, enum:Object.values(ApprovalStatus)},
  dateApproved:{type:Date},
  comment:[commentSchema],
  approvalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'}
},{
  timestamps:true
});

export const ApprovalOfficerSchema = new Schema({
  name:{type:String},
  id:{type:Schema.Types.ObjectId},
  office:{type:String},
  department:{type:String},
  stageOfApproval:{type:String, enum:Object.values(stagesOfApproval)}
});

export const TransferSchema = new Schema({
  cylinders:[{type:Schema.Types.ObjectId, ref:'registered-cylinders'}],
  initiator:{type:Schema.Types.ObjectId, ref:'User'},
  to:{type:Schema.Types.ObjectId, ref:'customer'},
  tracking:{
    type:[approvalStageShema]
  },
  transferStatus:{
    type:String,
    enum:Object.values(TransferStatus),
    default:TransferStatus.PENDING
  },
  approvalStage:{
    type:String,
    enum:Object.values(stagesOfApproval),
    default:stagesOfApproval.STAGE1
  },
  type:{
    type:String,
    enum:Object.values(TransferType)
  },
  approvalOfficers:[ApprovalOfficerSchema],
  comments:[commentSchema],
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'Users'},
  holdingTime:{type:Date},
  purchaseDate:{type:Date},
  purchasePrice:{type:Number},
  toBranch:{type:Schema.Types.ObjectId, ref:'branches'},
  toDepartment:{type:String},
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  gasType:{type:Schema.Types.ObjectId, ref:'cylinder'}
},{
  timestamps:true
});

TransferSchema.plugin(mongoosePaginate);
TransferSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection) : Model<TransferCylinder> {
  return conn.model('transfer-cylinder', TransferSchema);
}
