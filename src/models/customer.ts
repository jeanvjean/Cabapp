import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum CustomerType {
  WALKIN="walk-in",
  REGULAR="regular"
}

export interface CustomerInterface extends Document{
  _id:Schema.Types.ObjectId
  name:string
  customerType:CustomerType
  modeOfService:string
  nickName:string
  address:string
  contactPerson:string
  email:string
  TIN:string
  phoneNumber:number
  rcNumber:string
  cylinderHoldingTime:Date
  territory:string
  products:Schema.Types.ObjectId[]
  unitPrice:number
  CAC:string
  validID:string
  branch:Schema.Types.ObjectId
}

export const customerSchema = new Schema({
  name:{type:String, lowercase:true},
  customerType:{type:String, enum:Object.values(CustomerType), default:CustomerType.REGULAR, lowercase:true},
  modeOfeService:String,
  nickName:{type:String, lowercase:true},
  address:String,
  contactPerson:{type:String, lowercase:true},
  email:{type:String, lowercase:true},
  TIN:String,
  phoneNumber:Number,
  rcNumber:String,
  cylinderHoldingTime:Date,
  territory:String,
  products:[{type:Schema.Types.ObjectId, ref:'products'}],
  unitPrice:Number,
  CAC:String,
  validID:String,
  branch:{type:Schema.Types.ObjectId, ref:'branches'}
},{
  timestamps:true
});

customerSchema.plugin(mongoosePaginate);
customerSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<CustomerInterface> {
  return conn.model('customer', customerSchema);
}
