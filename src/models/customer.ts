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

interface customerProducts {
  product:{
    product_id:Schema.Types.ObjectId,
    productName:String,
    colorCode:String
  },
  unit_price:{
    value:number,
    unit:string
  }
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
  products:customerProducts[]
  CAC:string
  validID:string
  branch:Schema.Types.ObjectId,
  unique_id:string
  gen_id_no:number,
  vat:{
    value:number,
    unit:string
  }
}

const customerProductSchema = new Schema({
  product:{
    product_id:Schema.Types.ObjectId,
    productName:String,
    colorCode:String
  },
  unit_price:{
    value:Number,
    unit:String
  },
  vat:{
    value:Number,
    unit:String
  }
});

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
  products:[customerProductSchema],
  CAC:String,
  validID:String,
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  unique_id:{type:String, required:true, unique:true},
  gen_id_no:Number,
  vat:{
    value:Number,
    unit:String
  }
},{
  timestamps:true
});

customerSchema.plugin(mongoosePaginate);
customerSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<CustomerInterface> {
  return conn.model('customer', customerSchema);
}
