import {
  Schema,
  Document,
  Connection,
  Model
} from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import ProductionSchedule from '../modules/production';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface ProductInterface extends Document{
  productName:string
  itemDescription:string
  equipmentModel:string
  equipmentType:string
  areaOfSpecialization:string
  asnlNumber:string
  partNumber:string
  serialNumber?:number
  quantity:number
  unitCost:number
  totalCost:number
  reorderLevel:number
  location:string,
  referer:string
  division:string
  supplier?:Schema.Types.ObjectId
  branch:Schema.Types.ObjectId
  deleted:boolean
  inStock:boolean
  outOfStock:boolean
}

export const productSchema = new Schema({
  productName:{type:String, lowercase:true},
  itemDescription:{type:String, lowercase:true},
  equipmentModel:{type:String, lowercase:true},
  equipmentType:{type:String, lowercase:true},
  areaOfSpecialization:{type:String, lowercase:true},
  asnlNumber:{type:String, lowercase:true},
  partNumber:{type:String, lowercase:true},
  serialNumber:{type:Number},
  quantity:{type:Number},
  unitCost:{type:Number},
  totalCost:{type:Number},
  reorderLevel:{type:Number},
  location:{type:String, lowercase:true},
  referer:{type:String, lowercase:true},
  division:{type:Schema.Types.ObjectId, ref:'branches'},
  supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  deleted:{type:Boolean, default:false},
  inStock:{type:Boolean},
  outOfStock:{type:Boolean}
},{
  collection:'products',
  timestamps:true
});
productSchema.plugin(mongoosePaginate)
productSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection): Model<ProductInterface> {
  return conn.model('products',productSchema);
}
