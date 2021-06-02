import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';

export interface SupplierInterface extends Document {
  name:string
  location:string
  contactPerson:string
  emailAddress:string
  phoneNumber:number
  supplierType:string
  branch:Schema.Types.ObjectId
}

export const supplierSchema = new Schema({
  name:{type:String},
  location:{type:String},
  contactPerson:{type:String},
  emailAddress:{type:String},
  phoneNumber:{type:Number},
  supplierType:{type:String},
  branch:{type:Schema.Types.ObjectId, ref:'branches'}
});

export default function factory(conn:Connection):Model<SupplierInterface> {
  return conn.model('supplier', supplierSchema);
}
