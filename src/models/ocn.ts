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
    volume:{
        volume:number,
        unit:string
    }
    unitPrice?:number
    price?:number
}

export enum note {
  IN="in-coming",
  OUT="out-going"
}

export enum statuses {
    PASSED="passed",
    PENDING="pending"
}

export enum noteIcnType {
    CUSTOMER="customer",
    SUPPLIER="supplier",
    WALKIN="walk-in",
    COMPLAINT="complaint"
}

export interface OutgoingCylinderInterface extends Document {
    customer?:Schema.Types.ObjectId
    supplier?:Schema.Types.ObjectId
    cylinderType:string
    date:Date
    cylinders:Schema.Types.ObjectId[]
    otherCylinders:ocnCylinders[]
    totalQty:number
    totalVol:{
        value:number,
        unit:string
    }
    totalAmount:{
        value:number,
        unit:string
    }
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
    invoiceNo:string
    type:noteIcnType
}

const ocnCylinderSchema = new Schema({
    cylinderNo:String,
    volume:{
        volume:Number,
        unit:String
    },
    unitPrice:Number,
    price:Number
});


const ocnSchema = new Schema({
    customer:{type:Schema.Types.ObjectId, ref:'customer'},
    supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
    cylinderType:{type:String},
    date:{type:Date},
    cylinders:[{type:Schema.Types.ObjectId, ref:"registered-cylinders"}],
    otherCylinders:[ocnCylinderSchema],
    totalQty:Number,
    totalVol:{
        value:Number,
        unit:String
    },
    totalAmount:{
        value:Number,
        unit:String
    },
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
    vehicle:{type:Schema.Types.ObjectId, ref:"vehicle"},
    invoiceNo:String,
    type:{type:String, enum:Object.values(noteIcnType)}
});
ocnSchema.plugin(mongoosePaginate);
ocnSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<OutgoingCylinderInterface>{
    return conn.model('out-going-cylinders', ocnSchema);
}
