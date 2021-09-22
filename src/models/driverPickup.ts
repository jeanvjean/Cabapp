import {
  Schema,
  Connection,
  Model,
  Document
} from 'mongoose';
import { orderType, pickupType } from './order';
import { RouteActivity, RoutePlanStatus } from './vehicle';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { SupplierTypes } from './supplier';

export interface RouteCylinderInterface{
  cylinderNo:string
  cylinderSize:string
  totalVolume:string
  totalQuantity:number
}

export interface customerPickupInterface{
  name:string
  email:string
  destination:string
  departure:string
  numberOfCylinders:number,
  cylinders:Schema.Types.ObjectId[]
  fringeCylinders:RouteCylinderInterface[]
  status:RoutePlanStatus,
  reportId:string
  tecrNo:string
}

export interface supplierPickupInterface{
  supplierType: SupplierTypes;
  name?:string
  email:string
  destination:string
  departure:string
  numberOfCylinders:number,
  cylinders:Schema.Types.ObjectId[]
  fringeCylinders:RouteCylinderInterface[]
  status:RoutePlanStatus,  
  reportId:string
  tfcrNo:string
}


export interface PickupInterface extends Document{
  customer:Schema.Types.ObjectId
  supplier:Schema.Types.ObjectId
  customers:customerPickupInterface[]
  suppliers:supplierPickupInterface[]
  startDate:Date
  endDate?:Date
  activity:RouteActivity
  destination:string
  departure:string
  status:RoutePlanStatus
  ecrNo:string
  tfcrNo:string
  tecrNo:string
  icnNo:string
  orderType:pickupType
  modeOfService:string
  date:Date
  serialNo:number
  cylinders:RouteCylinderInterface[]
  vehicle:Schema.Types.ObjectId
  recievedBy:Schema.Types.ObjectId
  security:Schema.Types.ObjectId
  deleted:boolean
  branch:Schema.Types.ObjectId
  dateCompleted:Date
  ocnNo:string
  territory:string
  mileageIn:string
  mileageOut:string
  fuelGiven:string
  fuelsConsumed:string
  timeOut:string
  timeIn:string
  rppNo:string
}

export const routeCylinderSchema = new Schema({
  cylinderNo:String,
  cylinderSize:String,
  totalVolume:String,
  totalQuantity:Number
});

const routeSupplier = new Schema({
  name:String,
  email:String,
  destination:String,
  departure:String,
  numberOfCylinders:Number,
  cylinders:[{type:Schema.Types.ObjectId, ref:'registered-cylinders'}],
  fringeCylinders:[routeCylinderSchema],
  status:String,  
  reportId:String
});

const routeCustomer = new Schema({
  name:String,
  email:String,
  destination:String,
  departure:String,
  numberOfCylinders:Number,
  cylinders:[{type:Schema.Types.ObjectId, ref:'registered-cylinders'}],
  fringeCylinders:[routeCylinderSchema],
  status:String,
  reportId:String
});

const routeSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
  customers:[routeCustomer],
  suppliers:[routeSupplier],
  startDate:{type:Date},
  endDate:{type:Date},
  activity:{type:String, enum:Object.values(RouteActivity)},
  destination:{type:String},
  departure:{Type:String},
  status:{type:String, enum:Object.values(RoutePlanStatus)},
  ecrNo:{type:String},
  icnNo:{type:String},
  ocnNo:{type:String},
  tecrNo:{type:String},
  tfcrNo:{type:String},
  orderType:{type:String, enum:Object.values(pickupType)},
  modeOfService:{type:String},
  date:{type:Date},
  serialNo:{type:Number},
  cylinders:{type:[routeCylinderSchema]},
  vehicle:{type:Schema.Types.ObjectId, ref:'vehicle'},
  recievedBy:{type:Schema.Types.ObjectId, ref:'User'},
  security:{type:Schema.Types.ObjectId, ref:'User'},
  deleted:{type:Boolean, default:false},
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  dateCompleted:{type:Date},
  territory:{type:String},
  mileageIn:{type:String},
  mileageOut:{type:String},
  fuelGiven:{type:String},
  fuelsConsumed:{type:String},
  timeOut:{type:String},
  timeIn:{type:String},
  rppNo:String
},{
  timestamps:true
});

routeSchema.plugin(mongoosePaginate);
routeSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<PickupInterface> {
  return conn.model('pickup-routes', routeSchema);
}
