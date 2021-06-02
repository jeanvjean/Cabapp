import {
  Schema,
  Connection,
  Model,
  Document
} from 'mongoose';
import { RouteActivity, RoutePlanStatus } from './vehicle';


interface RouteCylinderInterface{
  cylinderNo:string
  cylinderSize:string
  totalVolume:string
  totalQuantity:string
}


export interface PickupInterface extends Document{
  customer:Schema.Types.ObjectId
  supplier:Schema.Types.ObjectId
  startDate:Date
  endDate?:Date
  activity:RouteActivity
  destination:string
  departure:string
  status:RoutePlanStatus
  ecrNo:string
  icnNo:string
  orderType:string
  modeOfService:string
  date:Date
  serialNo:number
  cylinders:RouteCylinderInterface[]
  vehicle:Schema.Types.ObjectId
  recievedBy:Schema.Types.ObjectId
  security:Schema.Types.ObjectId
  deleted:boolean
  branch:Schema.Types.ObjectId
}


const routeCylinderSchema = new Schema({
  cylinderNo:String,
  cylinderSize:String,
  totalVolume:String,
  totalQuantity:String
});

const routeSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
  startDate:{type:Date},
  endDate:{type:Date},
  activity:{type:String, enum:Object.values(RouteActivity)},
  destination:{type:String},
  departure:{Type:String},
  status:{type:String, enum:Object.values(RoutePlanStatus)},
  ecrNo:{type:String},
  icnNo:{type:String},
  orderType:{type:String},
  modeOfService:{type:String},
  date:{type:Date},
  serialNo:{type:Number},
  cylinders:{type:[routeCylinderSchema]},
  vehicle:{type:Schema.Types.ObjectId, ref:'vehicle'},
  recievedBy:{type:Schema.Types.ObjectId, ref:'User'},
  security:{type:Schema.Types.ObjectId, ref:'User'},
  deleted:{type:Boolean, default:false},
  branch:{type:Schema.Types.ObjectId, ref:'branches'}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<PickupInterface> {
  return conn.model('pickup-routes', routeSchema);
}
