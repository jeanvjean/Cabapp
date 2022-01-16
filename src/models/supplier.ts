import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
// import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
var aggregatePaginate = require('mongoose-aggregate-paginate-v2')

export enum SupplierTypes{
  INTERNAL="local",
  EXTERNAL="foreign"
}

export enum ProductType{
  GAS='gas-refill',
  GENERAL="general-inventory"
}

export interface SupplierInterface extends Document {
  name:string
  location:string
  contactPerson:string
  email:string
  phoneNumber:number
  supplierType:SupplierTypes
  branch:Schema.Types.ObjectId,
  productType:ProductType,
  unique_id:string
  gen_id_no:number,
}

export const supplierSchema = new Schema({
  name:{type:String},
  location:{type:String},
  contactPerson:{type:String},
  email:{type:String},
  phoneNumber:{type:Number},
  supplierType:{type:String, enum:Object.values(SupplierTypes), required:true},
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  productType:{type:String, enum:Object.values(ProductType)},
  unique_id:String,
  gen_id_no:Number,
});

supplierSchema.index({supplierType:'text', productType:'text'});
supplierSchema.plugin(mongoosePaginate);
supplierSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<SupplierInterface> {
  return conn.model('supplier', supplierSchema);
}
