import {
Schema,
Model,
Document,
Connection
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, ApprovalStage, approvalStageShema, commentInterface, commentSchema, stagesOfApproval, TransferStatus } from './transferCylinder';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface CondemnCylinderInterface extends Document{
  cylinders:Schema.Types.ObjectId[],
  nextApprovalOfficer:Schema.Types.ObjectId,
  approvalOfficers:ApprovalOfficers[],
  tracking:ApprovalStage[],
  approvalStage:stagesOfApproval,
  approvalStatus:TransferStatus,
  comments:commentInterface[],
  initiator:Schema.Types.ObjectId,
  branch:Schema.Types.ObjectId
}

const condemSchema = new Schema({
  cylinders:[{type:Schema.Types.ObjectId, ref:'registered-cylinders'}],
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  approvalOfficers:[ApprovalOfficerSchema],
  tracking:[approvalStageShema],
  approvalStage:{type:String, enum:Object.values(stagesOfApproval), default:stagesOfApproval.STAGE1},
  approvalStatus:{type:String, enum:Object.values(TransferStatus), default:TransferStatus.PENDING},
  comments:[commentSchema],
  initiator:{type:Schema.Types.ObjectId, ref:'User'},
  branch:{type:Schema.Types.ObjectId, ref:'branches'}
},{
  timestamps:true
});

condemSchema.plugin(mongoosePaginate);
condemSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection) : Model<CondemnCylinderInterface>{
  return conn.model('condemn', condemSchema);
}
