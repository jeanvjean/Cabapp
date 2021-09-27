import {
    Schema, 
    Model, 
    Document, 
    Connection
} from 'mongoose';
import { ApprovalOfficers, ApprovalOfficerSchema, ApprovalStatus } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { RouteCylinderInterface, routeCylinderSchema } from './driverPickup';

export enum Priority {
    URGENT=1,
    REGULAR=2,
    TRUCK=3

}

export enum EcrType {
    TRUCK="truck",
    SALES="sales"
}

export enum EcrApproval{
    PENDING="pending",
    APPROVED="approved",
    REJECTED="rejected",
    TRUCK="truck"
}

export enum ProductionSchedule {
    NEXT="next",
    PENDING="pending",
    SCHEDULED="scheduled",
    TRUCK="truck"
}

export interface EmptyCylinderInterface extends Document {
    customer:Schema.Types.ObjectId
    cylinders:Schema.Types.ObjectId[],
    fringeCylinders:RouteCylinderInterface[]
    priority?:Priority
    type?:EcrType
    approvalOfficers?:ApprovalOfficers[]
    nextApprovalOfficer?:Schema.Types.ObjectId
    status?:EcrApproval
    scheduled?:boolean
    position?:ProductionSchedule
    branch?:Schema.Types.ObjectId
    initNum?:number
    tecrNo?:string
    ecrNo?:string
    initiator?:Schema.Types.ObjectId,
    reason?:string,
    driverStatus?:EcrApproval
    otp?:string,
    totalVolume?:string
    totalQuantity?:string
};


const ecrSchema = new Schema({
    customer:{type:Schema.Types.ObjectId, ref:"customer"},
    cylinders:[{type:Schema.Types.ObjectId, ref:"registered-cylinders"}],
    fringeCylinders:[routeCylinderSchema],
    type:{type:String, enum:Object.values(EcrType)},
    priority:{type:Number, enum:Object.values(Priority), default:Priority.REGULAR},
    ApprovalOfficers:[ApprovalOfficerSchema],
    nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:"User"},
    status:{type:String, enum:Object.values(EcrApproval), default:EcrApproval.PENDING},
    scheduled:{type:Boolean, default:false},
    position:{type:String, enum:Object.values(ProductionSchedule), default:ProductionSchedule.PENDING},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    initNum:Number,
    ecrNo:String,
    tecrNo:String,
    initiator:{type:Schema.Types.ObjectId, ref:"User"},
    reason:String,
    driverStatus:{type:String, enum:Object.values(EcrApproval), default:EcrApproval.PENDING},
    otp:String,
    totalVolume:String,
    totalQuantity:String
},{
    timestamps:true
});

ecrSchema.plugin(aggregatePaginate);
ecrSchema.plugin(mongoosePaginate);

export default function factory(conn:Connection):Model<EmptyCylinderInterface>{
    return conn.model('empty-cylinders', ecrSchema);
};