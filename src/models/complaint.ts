import {
  Schema,
  Connection,
  Document,
  Model
} from 'mongoose';



export interface ComplaintInterface extends Document{
  customer:Schema.Types.ObjectId
  title?:string
  issue?:string
  comment?:string
  createdAt:Date
  updatedAt:Date
}

export const complaintSchema = new Schema({
  customer:{type:Schema.Types.ObjectId, ref:'customer'},
  title:{type:String},
  issue:{type:String},
  comment:{type:String}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<ComplaintInterface> {
  return conn.model('complaint', complaintSchema);
}
