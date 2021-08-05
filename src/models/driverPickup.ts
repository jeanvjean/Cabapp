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

interface RouteCylinderInterface{
  cylinderNo:string
  cylinderSize:string
  totalVolume:string
  totalQuantity:string
}

export interface customerPickupInterface{
  name:string
  destination:string
  departure:string
  numberOfCylinders:number,
  cylinders:RouteCylinderInterface[]
  status:RoutePlanStatus
}

export interface supplierPickupInterface{
  name?:string
  destination:string
  departure:string
  numberOfCylinders:number,
  cylinders:RouteCylinderInterface[]
  status:RoutePlanStatus
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
}

const routeCylinderSchema = new Schema({
  cylinderNo:String,
  cylinderSize:String,
  totalVolume:String,
  totalQuantity:String
});

const routeSupplier = new Schema({
  name:String,
  destination:String,
  departure:String,
  numberOfCylinders:Number,
  cylinders:[routeCylinderSchema],
  status:String
});

const routeCustomer = new Schema({
  name:String,
  destination:String,
  departure:String,
  numberOfCylinders:Number,
  cylinders:[routeCylinderSchema],
  status:String
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
  dateCompleted:{type:Date}
},{
  timestamps:true
});

routeSchema.plugin(mongoosePaginate);
routeSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<PickupInterface> {
  return conn.model('pickup-routes', routeSchema);
}
