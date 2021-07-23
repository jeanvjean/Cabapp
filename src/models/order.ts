import {
  Schema,
  Connection,
  Document,
  Model
} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum PickupStatus{
  PENDING='pending',
  DONE='done'
}

export interface trackingOrder{
  location?:string
  status?:string
}

export enum pickupType {
  SUPPLIER='supplier',
  CUSTOMER='customer'
};

export enum orderType {
  PICKUP='pick-up',
  DELIVERY="delivery"
}

export interface OrderInterface extends Document{
  pickupType?:pickupType
  pickupDate?:Date
  status:string
  numberOfCylinders?:number
  customer?:Schema.Types.ObjectId
  supplier?:Schema.Types.ObjectId
  vehicle?:Schema.Types.ObjectId
  cylinderSize?:string
  gasType?:string
  gasColor?:string,
  tracking:trackingOrder[],
  branch:Schema.Types.ObjectId
  orderType:orderType
  orderNumber:string
  initOn:number
  ecrNo:string
  icnNo:string
}

const trackingSchema = new Schema({
  location:String,
  status:String
});

const OrderSchema = new Schema({
  pickupType:{type:String, enum:Object.values(pickupType)},
  pickupDate:Date,
  status:{type:String, enum:Object.values(PickupStatus), default:PickupStatus.PENDING},
  numberOfCylinders:Number,
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
  vehicle:{type:Schema.Types.ObjectId, ref:'vehicle'},
  cylinderSize:{type:String},
  gasType:{type:Schema.Types.ObjectId, ref:'cylinder'},
  gasColor:{type:String},
  tracking:[trackingSchema],
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  orderType:{type:String, enum:Object.values(orderType)},
  initOn:{type:Number},
  orderNumber:{type:String},
  ecrNo:{type:String},
  icnNo:{type:String}
},{
  timestamps:true
});
OrderSchema.plugin(mongoosePaginate)
OrderSchema.plugin(aggregatePaginate)
export default function factory(conn:Connection):Model<OrderInterface>{
  return conn.model('orders', OrderSchema);
};
