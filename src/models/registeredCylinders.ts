import {
  Model,
  Document,
  Schema,
  Connection,
  model
} from 'mongoose';
import { CylinderCondition } from './cylinder';

export enum TypesOfCylinders {
  BUFFER="buffer",
  ASSIGNED="assigned"
}


export interface RegisteredCylinderInterface extends Document{
  /**
   * @param _id object id auto gen
   */
  _id:Schema.Types.ObjectId,
  /**
   * @param cylinderType type of cylinder being registered
   */
  cylinderType:string,
  /**
   * @param waterCapacity cylinder water capacity
   */
  waterCapacity:string

  /**
   * @param dateManufactured manufacturing date of cylinder
   */

  dateManufactured:Date

  /**
   * @param assignedTo cylinder assigned to
   */

  assignedTo:Schema.Types.ObjectId

  /**
   * @param gasType type of gas contained in cylinder
   */

  gasType:Schema.Types.ObjectId

  /**
   * @param standardColor standard gas color for cylinder
   */

  standardColor: string

  /**
   * @param assignedNumber
   */

  assignedNumber:string

  /**
   * @param testingPresure
   */

  testingPresure:string

  /**
   * @param fillingPreasure
   */

  fillingPreasure:string

  /**
   * @param gasVolumeContent
   */

  gasVolumeContent:string

  /**
   * @param cylinderNumber
   */

  cylinderNumber:string

  /**
   * @param condition cylinder condition
   */

  condition:CylinderCondition

  /**
   * @param createdAt
   */

  createdAt: Date

  /**
   * @param updatedAt
   */

  updatedAt: Date

}

export const registerCylinderSchema = new Schema({
  cylinderType:{type:String, enum:Object.values(TypesOfCylinders)},

  waterCapacity:{type:String},

  dateManufactured:{type:Date},

  assignedTo:{type:Schema.Types.ObjectId},

  gasType:{type:Schema.Types.ObjectId},

  standardColor:{type:String},

  assignedNumber:{type:String},

  testingPresure:{type:String},

  fillingPreasure:{type:String},

  gasVolumeContent:{type:String},

  cylinderNumber:{type:String},

  condition:{type:String, enum:Object.values(CylinderCondition)}
},{
  timestamps:true
});

export default function factory(conn:Connection): Model<RegisteredCylinderInterface> {
  return conn.model('registered-cylinders', registerCylinderSchema);
}
