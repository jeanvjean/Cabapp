import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, ApprovalStage, approvalStageShema, commentInterface, commentSchema, stagesOfApproval, TransferStatus } from './transferCylinder';

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
}

// const commentSchema = new Schema({
//   comment:{type:String},
//   commentBy:{type:Schema.Types.ObjectId}
// },{
//   timestamps:true
// });

const disburseProductSchema = new Schema({
  productNumber:{type:String},
  productName:{type:String},
  quantityRequested:{type:Number},
  quantityReleased:{type:Number},
  comment:{type:String}
})

export const disburseSchema = new Schema({
  products:[disburseProductSchema],
  releasedBy:{type:Schema.Types.ObjectId, ref:'users'},
  releasedTo:{type:Schema.Types.ObjectId, ref:"users"},
  comments:[commentSchema],
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'users'},
  approvalStage:{type:String, enum:Object.values(stagesOfApproval)},
  disburseStatus:{type:String, enum:Object.values(TransferStatus)},
  tracking:[approvalStageShema],
  approvalOfficers:[ApprovalOfficerSchema]
});

export default function factory(conn:Connection):Model<DisburseProductInterface>{
  return conn.model('disburse-product', disburseSchema);
}
