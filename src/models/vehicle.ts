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
  disposalMileage:string
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
  prevMileage:string
  curMileage:string,
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
  vehicleType:string
  manufacturer:string
  vModel:string
  regNo:string
  acqisistionDate:Date
  mileageDate?:Date
  currMile:string
  assignedTo:Schema.Types.ObjectId//driver
  vehCategory:string
  tankCapacity:string
  batteryCapacity:string
  fuelType:string
  grossWeight:string
  netWeight:string
  disposal:Disposal
  maintainace:Maintainance[]
  routes:RecordRoute[]
  licence:string
  insuranceDate:Date
  lastMileage?:string
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
  curMileage:{type:String},
  prevMileage:{type:String},
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
  disposalMileage:{type:String}
},{
  timestamps:true
});

export const vehicleSchema = new Schema({
  vehicleType:{type:String},
  manufacturer:{type:String},
  vModel:{type:String},
  regNo:{type:String},
  acqisistionDate:{type:Date},
  mileageDate:{type:Date},
  currMile:{type:String},
  assignedTo:{type:Schema.Types.ObjectId, ref:'User'},
  vehCategory:{type:String},
  tankCapacity:{type:String},
  batteryCapacity:{type:String},
  fuelType:{type:String},
  grossHeight:{type:String},
  netWeight:{type:String},
  disposal:disposalSchema,
  maintainace:{type:[maintainaceSchema]},
  routes:[routeSchema],
  licence:{type:String},
  insuranceDate:{type:String},
  lastMileage:{type:String},
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
