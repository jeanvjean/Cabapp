import {
  Schema,
  Document,
  Model,
  Connection
} from 'mongoose';

export interface DriverInterface extends Document{
  name:string
  address:string
  email:string
  qualification:string
  image:string
  age:string
  height:string
}

export const driverSchema = new Schema({
  name:{type:String},
  age:{type:String},
  email:{type:String, unique:true},
  qualification:{type:String},
  height:{type:String},
  address:{type:String},
  image:{type:String}
});

export default function factory(conn:Connection):Model<DriverInterface> {
  return conn.model('driver',driverSchema);
}
