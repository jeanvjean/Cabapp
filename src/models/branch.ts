import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';


export interface BranchInterface extends Document{
  name:string
  location:string
  officers:Schema.Types.ObjectId[]
  products:Schema.Types.ObjectId[]
  creator:Schema.Types.ObjectId
  branchAdmin:Schema.Types.ObjectId
}

const branchSchema = new Schema({
  name:{type:String, required:true},
  officers:[{type:Schema.Types.ObjectId, ref:'User'}],
  products:[{type:Schema.Types.ObjectId, ref:'products'}],
  branchAdmin:{type:Schema.Types.ObjectId, ref:'User'},
  location:{type:String}
},{
  timestamps:true
});

export default function factory(conn:Connection):Model<BranchInterface>{
  return conn.model('branches', branchSchema);
}
