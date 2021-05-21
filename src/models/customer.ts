import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';

export interface CustomerInterface extends Document{
  _id:Schema.Types.ObjectId
  name:string
  customerType:string
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
  name:String,
  customerType:String,
  modeOfeService:String,
  nickName:String,
  address:String,
  contactPerson:String,
  email:String,
  TIN:String,
  phoneNumber:Number,
  rcNumber:String,
  cylinderHoldingTime:Date,
  territory:String,
  products:[{type:Schema.Types.ObjectId, ref:'products'}],
  unitPrice:Number,
  CAC:String,
  validID:String,
  branch:{type:Schema.Types.ObjectId, ref:'customer'}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<CustomerInterface> {
  return conn.model('customer', customerSchema);
}
