import {
Schema,
Connection,
Document,
Model
} from 'mongoose';

export enum WalkinCustomerStatus {
  FILLED="filled",
  EMPTY="empty"
}


export interface WalkinCustomerInterface extends Document{
  customerName:string
  ercNo:string
  orderType:string
  date:Date
  icnNo:string
  modeOfService:string
  serialNo:number
  cylinderNo:string
  cylinderSize:string
  totalVolume:string
  totalQuantity:string
  branch:Schema.Types.ObjectId
  status:WalkinCustomerStatus
}

const walkInCustomerSchema = new Schema({
  customerName:String,
  ercNo:String,
  orderType:String,
  date:Date,
  icnNo:String,
  modeOfService:String,
  serialNo:Number,
  cylinderNo:String,
  cylinderSize:String,
  totalVolume:String,
  totalQuantity:String,
  branch:{type:Schema.Types.ObjectId, ref:'branches'},
  status:{type:String, enum:Object.values(WalkinCustomerStatus), default:WalkinCustomerStatus.EMPTY}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<WalkinCustomerInterface>{
  return conn.model('walk-in-customer', walkInCustomerSchema);
}
