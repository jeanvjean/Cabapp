import {
  Schema,
  Connection,
  Document,
  Model
} from 'mongoose';


export enum PickupStatus{
  PENDING='pending',
  DONE='done'
}

export interface OrderInterface extends Document{
  pickupType:string
  pickupDate:Date
  status:string
  numberOfCylinders:number
  customer:Schema.Types.ObjectId
  vehicle:Schema.Types.ObjectId
}

const OrderSchema = new Schema({
  pickupType:String,
  pickupDate:Date,
  status:{type:String, enum:Object.values(PickupStatus), default:PickupStatus.PENDING},
  numberOfCylinders:Number,
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  vehicle:{type:Schema.Types.ObjectId, ref:'vehicle'}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<OrderInterface>{
  return conn.model('orders', OrderSchema);
};
