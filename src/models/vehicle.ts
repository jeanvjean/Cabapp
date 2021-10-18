import {
Schema,
Document,
Connection,
Model
} from 'mongoose';
import { commentInterface, commentSchema, stagesOfApproval } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';


export type Disposal = {
  disposalDate:Date,
  disposalAmount:number
  disposalMileage:{
    value:number,
    unit:string
  }
}

export enum maintType {
  CORRECTIVE='corrective',
  PREINSPECTION = 'pre-inspection'
}

export type MaintainanceAnalytics ={
  requestAuthenticity:string,
  estimateObtained:string,
  itemPrice:number,
  recomendation:string
}

export enum InspectApproval {
  APPROVED='approved',
  REJECTED='rejected',
  PENDING='pending'
}

interface InspectionApprovalOfficer {
  name:string,
  position:string,
  uniqueId:Schema.Types.ObjectId
  stage:stagesOfApproval
}

export type Maintainance = {
  type:maintType
  operation:string
  cost:number
  date:Date
  prevMileage:{
    value:number,
    unit:string
  }
  curMileage:{
    value:number,
    unit:string
  },
  itemsReplaced?:ReplacedItems[]
  comments?:commentInterface[]
  approvalStatus?:InspectApproval
  approvalOfficer?:Schema.Types.ObjectId
  analytics?:MaintainanceAnalytics
  recomendedMech?:string,
  referer?:string
}
 export enum RouteActivity {
  PICKUP='pick-up',
  DELIVERY='delivery'
}

export enum RoutePlanStatus {
  PROGRESS='in-progress',
  DONE='done'
}

export type RecordRoute = {
  customer:Schema.Types.ObjectId,
  startDate:Date
  endDate?:Date
  activity:RouteActivity
  destination:string
  departure:string
  status:RoutePlanStatus
}

export interface VehicleInterface extends Document{
  vehicleName:string
  vehicleType:string
  manufacturer:string
  vModel:string
  regNo:string
  acqisistionDate:Date
  mileageDate?:Date
  currMile:{
    value:number,
    unit:string
  }
  assignedTo:Schema.Types.ObjectId//driver
  vehCategory:string
  tankCapacity:{
    value:number,
    unit:string
  }
  batteryCapacity:string
  fuelType:string
  grossWeight:{
    value:number,
    unit:string
  }
  netWeight:{
    value:number,
    unit:string
  }
  disposal:Disposal
  maintainace:Maintainance[]
  routes:RecordRoute[]
  licence:string
  insuranceDate:Date
  lastMileage?:{
    value:number,
    unit:string
  }
  comments:commentInterface[]
  branch:Schema.Types.ObjectId
}

export type ReplacedItems = {
  name:string
  qty:number,
  unitCost:number
  totalCost:number
}

const replacedItemSchema = new Schema({
  name:String,
  qty:Number,
  unitCost:Number,
  totalCost:Number
});

const routeSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  startDate:Date,
  endDate:Date,
  activity:{type:String, enum:Object.values(RouteActivity)},
  destination:String,
  departure:String,
  status:{type:String, enum:Object.values(RoutePlanStatus)}
});

const maintainaceSchema = new Schema({
  type:{type:String, enum:Object.values(maintType)},
  operation:String,
  cost:Number,
  date:Date,
  curMileage:{
    value:Number,
    unit:String
  },
  prevMileage:{
    value:Number,
    unit:String
  },
  itemsReplaced:[replacedItemSchema],
  comments:[commentSchema],
  approvalStatus:{type:String},
  approvalStage:{type:String},
  nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  recomendedMech:String,
  referer:String,
},{
  timestamps:true
});

const disposalSchema = new Schema({
  disposalDate:{type:Date},
  disposalAmount:{type:Number},
  disposalMileage:{
    value:Number,
    unit:String
  }
},{
  timestamps:true
});

export const vehicleSchema = new Schema({
  vehicleName:{type:String},
  vehicleType:{type:String},
  manufacturer:{type:String},
  vModel:{type:String},
  regNo:{type:String},
  acqisistionDate:{type:Date},
  mileageDate:{type:Date},
  currMile:{
    value:Number,
    unit:String
  },
  assignedTo:{type:Schema.Types.ObjectId, ref:'User'},
  vehCategory:{type:String},
  tankCapacity:{
    value:Number,
    unit:String
  },
  batteryCapacity:{type:String},
  fuelType:{type:String},
  grossHeight:{
    value:Number,
    unit:String
  },
  netWeight:{
    value:Number,
    unit:String
  },
  disposal:disposalSchema,
  maintainace:{type:[maintainaceSchema]},
  routes:[routeSchema],
  licence:{type:String},
  insuranceDate:{type:String},
  lastMileage:{
    value:Number,
    unit:String
  },
  comments:[commentSchema],
  branch:{type:Schema.Types.ObjectId, ref:'branches'}
},{
  timestamps:true
});

vehicleSchema.plugin(mongoosePaginate);
vehicleSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<VehicleInterface> {
  return conn.model('vehicle', vehicleSchema);
}
