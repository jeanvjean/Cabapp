import {
Schema,
Connection,
Document,
Model
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum WalkinCustomerStatus {
  FILLED="filled",
  EMPTY="empty"
}

export interface WalkinCustomerCylinder {
  cylinderNo:string
  cylinderSize:string
  totalVolume:string
  totalQuantity:string
}


export interface WalkinCustomerInterface extends Document{
  customerName:string
  ercNo:string
  orderType:string
  cylinders:WalkinCustomerCylinder[]
  date:Date
  icnNo:string
  modeOfService:string
  serialNo:number
  totalQuantity:string
  branch:Schema.Types.ObjectId
  status:WalkinCustomerStatus
  recievedBy:Schema.Types.ObjectId
  security:Schema.Types.ObjectId
}

const walkinCustomerCylinderSchema = new Schema({
  cylinderNo:String,
  cylinderSize:String,
  totalVolume:String,
});

const walkInCustomerSchema = new Schema({
  customerName:String,
  ercNo:String,
  orderType:String,
  cylinders:[walkinCustomerCylinderSchema],
  date:Date,
  icnNo:String,
  totalQuantity:String,
  modeOfService:String,
  serialNo:Number,
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  status:{type:String, enum:Object.values(WalkinCustomerStatus), default:WalkinCustomerStatus.EMPTY},
  recievedBy:{type:Schema.Types.ObjectId, ref:"User"},
  security:{type:Schema.Types.ObjectId, ref:'User'}
},{
  timestamps:true
});

walkInCustomerSchema.plugin(mongoosePaginate);
walkInCustomerSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<WalkinCustomerInterface>{
  return conn.model('walk-in-customer', walkInCustomerSchema);
}
