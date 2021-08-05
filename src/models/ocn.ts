import {
Schema,
Document,
Model,
Connection
} from 'mongoose';
import { ApprovalOfficers, stagesOfApproval, TransferStatus, approvalStageShema } from './transferCylinder';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

type ocnCylinders = {
    cylinderNo:string
    volume:string
    unitPrice:number
    price:number
}

export enum note {
  IN="in-coming",
  OUT="out-going"
}

export enum statuses {
    PASSED="passed",
    PENDING="pending"
}

export interface OutgoingCylinderInterface extends Document {
    customer:Schema.Types.ObjectId,
    cylinderType:string
    date:Date
    cylinders:ocnCylinders[]
    totalQty:number
    totalVol:string
    totalAmount:number
    approvalOfficers:ApprovalOfficers[]
    approvalStage:stagesOfApproval
    approvalStatus:TransferStatus
    nextApprovalOfficer:Schema.Types.ObjectId
    branch:Schema.Types.ObjectId
    ocnNo:string
    ocnInit:number
    noteType:note
    totalAsnlCylinders:number
    totalCustomerCylinders:number
    vehicle?:Schema.Types.ObjectId
    icnNo:string
}

const ocnCylinderSchema = new Schema({
    cylinderNo:String,
    volume:String,
    unitPrice:Number,
    price:Number
});


const ocnSchema = new Schema({
    customer:{type:Schema.Types.ObjectId, ref:'customer'},
    cylinderType:{type:String},
    date:{type:Date},
    cylinders:{type:[ocnCylinderSchema]},
    totalQty:{type:Number},
    totalVol:{type:String},
    totalAmount:{type:Number},
    approvalOfficers:{type:[approvalStageShema]},
    approvalStage:{type:String, enum:Object.values(stagesOfApproval), default:stagesOfApproval.STAGE1},
    approvalStatus:{type:String, enum:Object.values(TransferStatus), default:TransferStatus.PENDING},
    status:{type:String, enum:Object.values(statuses)},
    nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    ocnNo:{type:String},
    icnNo:{type:String},
    noteType:{type:String, enum:Object.values(note)},
    ocnInit:Number,
    totalAsnlCylinders:Number,
    totalCustomerCylinders:Number,
    vehicle:{type:Schema.Types.ObjectId, ref:"vehicle"}
});
ocnSchema.plugin(mongoosePaginate);
ocnSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<OutgoingCylinderInterface>{
    return conn.model('out-going-cylinders', ocnSchema);
}
