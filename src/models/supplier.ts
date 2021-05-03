import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';

export interface SupplierInterface extends Document {
  productType:Schema.Types.ObjectId[]
  name:string
  location:string
  contactPerson:string
  emailAddress:string
  phoneNumber:number
  supplierType:string
}

export const supplierSchema = new Schema({
  productType:[{type:Schema.Types.ObjectId, ref:'products'}],
  name:{type:String},
  location:{type:String},
  contactPerson:{type:String},
  emailAddress:{type:String},
  phoneNumber:{type:Number},
  supplierType:{type:String}
});

export default function factory(conn:Connection):Model<SupplierInterface> {
  return conn.model('supplier', supplierSchema);
}
