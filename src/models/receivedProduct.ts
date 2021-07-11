import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';
import { commentInterface, commentSchema } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export enum productDirection {
  IN="in-coming",
  OUT="out-going"
}

export interface InventoryInterface extends Document{
  supplier:string,
  LPOnumber:string,
  wayBillNumber:string,
  invoiceNumber:string,
  dateReceived:string,
  products:ReceivedProduct[],
  inspectingOfficer:Schema.Types.ObjectId,
  grnDocument:string
  direction:productDirection,
  branch:Schema.Types.ObjectId
  grnNo:string
  grInit:number
}

export interface ReceivedProduct {
  partNumber:string,
  productName:string
  quantity:number
  passed?:number
  rejected?:number
  unitCost:number
  totalCost:string
  comment?:string
  totalAvailable?:number,
  equipmentModel?:string,
  equipmentType?:string
}

export const productRecievedSchema = new Schema({
  partNumber:{type:String},
  productName:{type:String},
  quantity:{type:Number},
  passed:{type:Number},
  rejected:{type:Number},
  unitCost:{type:Number},
  totalCost:{type:Number},
  comment:{type:String},
  totalAvailable:{type:Number},
  equipmentModel:{type:String},
  equipmentType:{type:String}
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
  grnDocument:{type:String},
  direction:{type:String, enum:Object.values(productDirection)},
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  grnNo:{type:String},
  grInit:{type:Number}
});

inventorySchema.plugin(mongoosePaginate);
inventorySchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<InventoryInterface> {
  return conn.model('inventory', inventorySchema);
}
