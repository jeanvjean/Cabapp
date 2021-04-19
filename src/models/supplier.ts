import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';

export interface SupplierInterface extends Document {
  productType:string
  name:string
  location:string
  contactPerson:string
  emailAddress:string
  phoneNumber:number
  supplierType:string
}

export const supplierSchema = new Schema({
  productType:{type:String},
  name:{type:String},
  location:{type:String},
  contactPerson:{type:String},
  emailAddress:{type:String},
  phoneNumber:{type:Number},
  supplierType:{type:String}
})

export default function factory(conn:Connection):Model<SupplierInterface> {
  return conn.model('supplier', supplierSchema);
}
