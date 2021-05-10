import {
  Schema,
  Connection,
  Document,
  Model
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, commentInterface, commentSchema, stagesOfApproval } from './transferCylinder';

interface complaintCylinder {
  cylinderNo:string
  cylinderSize:string,
  dateSupplied:Date
  waybillNo:string
  totalVolume:string
}

interface cylinderReplace{
  cylinderNo:string
  cylinderSize:string
  totalVolume:string
}

export enum complaintStatus {
  RESOLVED="resolved",
  PENDING="pending"
}


export interface ComplaintInterface extends Document{
  customer:Schema.Types.ObjectId
  initiator:Schema.Types.ObjectId
  complaintType?:string
  title?:string
  issue?:string
  comment?:string,
  cylinders?:complaintCylinder[]
  replaceCylinder:cylinderReplace
  approvalStage:stagesOfApproval
  approvalOfficers:ApprovalOfficers[]
  nextApprovalOfficer:Schema.Types.ObjectId
  additionalAction:string
  comments:commentInterface[]
  approvalStatus:string
  status:complaintStatus
  icnNo?:string
  ecrNo?:string
  createdAt:Date
  updatedAt:Date
}

const complaintCylinderSchema = new Schema({
  cylinderNo:String,
  cylinderSize:String,
  dateSupplied:Date,
  waybillNo:String,
  totalVolume:String
});

const cylinderReplaceSchema = new Schema({
  cylinderNo:String,
  cylinderSize:String,
  totalVolume:String
});

export const complaintSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  initiator:{type:Schema.Types.ObjectId, ref:'customer'},
  title:{type:String},
  issue:{type:String},
  complaint:{type:String},
  cylinders:[complaintCylinderSchema],
  cylinderReplace:cylinderReplaceSchema,
  status:{type:String, enum:Object.values(complaintStatus),default:complaintStatus.PENDING},
  approvalStage:{type:String},
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'users'},
  approvalOfficers:[ApprovalOfficerSchema],
  comments:[commentSchema],
  approvalStatus:{type:String}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<ComplaintInterface> {
  return conn.model('complaint', complaintSchema);
}
