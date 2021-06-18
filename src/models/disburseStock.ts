import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, ApprovalStage, approvalStageShema, commentInterface, commentSchema, stagesOfApproval, TransferStatus } from './transferCylinder';
import * as mongoosePaginate from 'mongoose-paginate-v2';
export interface DisburseProduct {
  productNumber:string,
  productName:string
  quantityRequested:number
  quantityReleased:number
  comment:string
}

// type disburseComment = {
//   comment: string,
//   commentBy:Schema.Types.ObjectId
// }

export type RequesterInterface = {
  requestingOfficer:Schema.Types.ObjectId
  branch:Schema.Types.ObjectId
}


export interface DisburseProductInterface extends Document{
  products:DisburseProduct[]
  releasedBy:Schema.Types.ObjectId
  releasedTo:Schema.Types.ObjectId
  comments:commentInterface[]
  nextApprovalOfficer:Schema.Types.ObjectId
  approvalStage:stagesOfApproval
  approvalStatus:TransferStatus
  tracking:ApprovalStage[]
  approvalOfficers:ApprovalOfficers[]
  disburseStatus:TransferStatus
  branch:Schema.Types.ObjectId
  fromBranch:Schema.Types.ObjectId
  requestFrom:RequesterInterface
  requestApproval:TransferStatus
  requestStage:stagesOfApproval,
  initiator:Schema.Types.ObjectId
  inspectingOfficer:Schema.Types.ObjectId
  jobTag:string
  customer:Schema.Types.ObjectId
  mrn:string
}

const requesterSchema = new Schema({
  requestingOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  branch:{type:Schema.Types.ObjectId}
},{
  timestamps:true
});

const disburseProductSchema = new Schema({
  productNumber:{type:String},
  productName:{type:String},
  quantityRequested:{type:Number},
  quantityReleased:{type:Number},
  comment:{type:String}
});

export const disburseSchema = new Schema({
  products:[disburseProductSchema],
  releasedBy:{type:Schema.Types.ObjectId, ref:'User'},
  releasedTo:{type:Schema.Types.ObjectId, ref:"User"},
  comments:[commentSchema],
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  approvalStage:{type:String, enum:Object.values(stagesOfApproval)},
  disburseStatus:{type:String, enum:Object.values(TransferStatus)},
  requestStage:{type:String, enum:Object.values(stagesOfApproval)},
  requestApproval:{type:String, enum:Object.values(TransferStatus)},
  tracking:[approvalStageShema],
  approvalOfficers:[ApprovalOfficerSchema],
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  fromBranch:{type:Schema.Types.ObjectId, ref:'branches'},
  requestFrom:{type:requesterSchema},
  initiator:{type:Schema.Types.ObjectId, ref:'User'},
  jobTag:{type:String},
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  mrn:{type:String}
});

disburseSchema.plugin(mongoosePaginate);

export default function factory(conn:Connection):Model<DisburseProductInterface>{
  return conn.model('disburse-product', disburseSchema);
}
