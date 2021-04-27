import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';

export interface ProductInterface extends Document{
  productName:string
  itemDescription:string
  equipmentModel:string
  equipmentType:string
  areaOfSpecialization:string
  asnlNumber:string
  partNumber:string
  serialNumber:string
  quantity:number
  unitCost:number
  totalCost:number
  reorderLevel:number
  location:string,
  referer:string
  division:string
  supplier:string
}

export const productSchema = new Schema({
  productName:{type:String},
  itemDescription:{type:String},
  equipmentModel:{type:String},
  equipmentType:{type:String},
  areaOfSpecialization:{type:String},
  asnlNumber:{type:String},
  partNumber:{type:String},
  serialNumber:{type:String},
  quantity:{type:Number},
  unitCost:{type:Number},
  totalCost:{type:Number},
  reorderLevel:{type:Number},
  location:{type:String},
  referer:{type:String},
  division:{type:String},
  supplier:{type:String}
},{
  timestamps:true
});

export default function factory(conn:Connection): Model<ProductInterface> {
  return conn.model('products',productSchema);
}
