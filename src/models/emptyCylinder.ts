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
    TRUCK=3,
    COMPLAINT=4
}

export enum EcrType {
    TRUCK="truck",
    SALES="sales",
    COMPLAINT="complaint",
    FILLED="filled"
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
    supplier:Schema.Types.ObjectId
    cylinders:Schema.Types.ObjectId[],
    fringeCylinders?:RouteCylinderInterface[]
    gasType:Schema.Types.ObjectId
    priority?:Priority
    type?:EcrType,
    icnNo?:string
    approvalOfficers?:ApprovalOfficers[]
    nextApprovalOfficer?:Schema.Types.ObjectId
    status?:EcrApproval
    scheduled?:boolean
    position?:ProductionSchedule
    branch?:Schema.Types.ObjectId
    initNum?:number
    tecrNo?:string
    fcrNo:string,
    tfcrNo:string,
    waybillNo?:string
    ecrNo?:string
    initiator?:Schema.Types.ObjectId,
    reason?:string,
    driverStatus?:EcrApproval
    otp?:string,
    closed:boolean
    totalVolume?:{
        value:number,
        unit:string
    }
    totalQuantity?:string
    icn_id?:Schema.Types.ObjectId
};


const ecrSchema = new Schema({
    customer:{type:Schema.Types.ObjectId, ref:"customer"},    
    supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
    cylinders:[{type:Schema.Types.ObjectId, ref:"registered-cylinders"}],
    fringeCylinders:[routeCylinderSchema],
    type:{type:String, enum:Object.values(EcrType)},
    gasType:{type:Schema.Types.ObjectId, ref:"cylinder"},
    icnNo:String,
    priority:{type:Number, enum:Object.values(Priority), default:Priority.REGULAR},
    ApprovalOfficers:[ApprovalOfficerSchema],
    nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:"User"},
    status:{type:String, enum:Object.values(EcrApproval), default:EcrApproval.PENDING},
    scheduled:{type:Boolean, default:false},
    position:{type:String, enum:Object.values(ProductionSchedule), default:ProductionSchedule.PENDING},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    initNum:Number,
    ecrNo:String,
    fcrNo:String,
    tfcrNo:String,
    tecrNo:String,
    initiator:{type:Schema.Types.ObjectId, ref:"User"},
    reason:String,
    driverStatus:{type:String, enum:Object.values(EcrApproval), default:EcrApproval.PENDING},
    waybillNo:String, //if its a complaint
    otp:String,
    closed:{type:Boolean, default:false},
    totalVolume:{
        value:Number,
        unit:String
    },
    totalQuantity:String,
    icn_id:{type:Schema.Types.ObjectId, ref:"out-going-cylinders"}
},{
    timestamps:true
});

ecrSchema.plugin(aggregatePaginate);
ecrSchema.plugin(mongoosePaginate);

export default function factory(conn:Connection):Model<EmptyCylinderInterface>{
    return conn.model('empty-cylinders', ecrSchema);
};