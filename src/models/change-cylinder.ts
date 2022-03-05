/* eslint-disable max-len */
import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import {TypesOfCylinders} from './registeredCylinders';
import {ApprovalOfficers, ApprovalOfficerSchema, ApprovalStage, approvalStageShema, commentInterface, commentSchema, stagesOfApproval, TransferStatus} from './transferCylinder';


export interface ChangeCylinderInterface extends Document{
  cylinders: Schema.Types.ObjectId[];
  nextApprovalOfficer: Schema.Types.ObjectId;
  approvalOfficers: ApprovalOfficers[];
  tracking: ApprovalStage[];
  approvalStage: stagesOfApproval;
  approvalStatus: TransferStatus;
  comments: commentInterface[];
  initiator: Schema.Types.ObjectId;
  branch: Schema.Types.ObjectId;
  gasType: Schema.Types.ObjectId;
  cylinderType: TypesOfCylinders;
  assignedTo: Schema.Types.ObjectId;
}

const cylinderChangeSchem = new Schema({
  cylinders: [{type: Schema.Types.ObjectId, ref: 'registered-cylinders'}],
  nextApprovalOfficer: {type: Schema.Types.ObjectId, ref: 'User'},
  approvalOfficers: [ApprovalOfficerSchema],
  tracking: [approvalStageShema],
  approvalStage: {type: String, enum: Object.values(stagesOfApproval), default: stagesOfApproval.STAGE1},
  approvalStatus: {type: String, enum: Object.values(TransferStatus), default: TransferStatus.PENDING},
  comments: [commentSchema],
  initiator: {type: Schema.Types.ObjectId, ref: 'User'},
  branch: {type: Schema.Types.ObjectId, ref: 'branches'},
  gasType: {type: Schema.Types.ObjectId, ref: 'cylinder'},
  cylinderType: {type: String, enum: Object.values(TypesOfCylinders)},
  assignedTo: {type: Schema.Types.ObjectId, ref: 'customer'}
}, {
  timestamps: true
});

cylinderChangeSchem.plugin(mongoosePaginate);
cylinderChangeSchem.plugin(aggregatePaginate);

export default function factory(conn: Connection): Model<ChangeCylinderInterface> {
  return conn.model('change-cylinder', cylinderChangeSchem);
}
