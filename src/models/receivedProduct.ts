import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';
import { commentInterface, commentSchema } from './transferCylinder';


export interface InventoryInterface extends Document{
  supplier:string,
  LPOnumber:string,
  wayBillNumber:string,
  invoiceNumber:string,
  dateReceived:string,
  products:ReceivedProduct[],
  inspectingOfficer:Schema.Types.ObjectId,
  grnDocument:string
}

export interface ReceivedProduct {
  productNumber:string,
  productName:string
  quantity:number
  passed:number
  rejected:number
  unitCost:number
  totalCost:string
  comment:string
  totalAvailable:number
}

export const productRecievedSchema = new Schema({
  productNumber:{type:Number},
  productName:{type:String},
  quantity:{type:Number},
  passed:{type:Number},
  rejected:{type:Number},
  unitCost:{type:Number},
  totalCost:{type:Number},
  comment:{type:String},
  totalAvailable:{type:Number}
},{
  timestamps:true
});

export const inventorySchema = new Schema({
  supplier:{type:String},
  LPOnumber:{type:String},
  wayBillNumber:{type:String},
  invoiceNumber:{type:String},
  dateReceived:{type:Date},
  products:[productRecievedSchema],
  inspectingOfficer:{type:Schema.Types.ObjectId, ref:'User'},
  grnDocument:{type:String}
});

export default function factory(conn:Connection):Model<InventoryInterface> {
  return conn.model('inventory', inventorySchema);
}
