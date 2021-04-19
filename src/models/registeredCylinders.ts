import {
  Model,
  Document,
  Schema,
  Connection,
  model
} from 'mongoose';


export interface RegisteredCylinderInterface extends Document{
  /**
   * @param _id object id auto gen
   */
  _id:Schema.Types.ObjectId,
  /**
   * @param cylinderType type of cylinder being registered
   */
  cylinderType:Schema.Types.ObjectId,
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
   * @param originalCylinderNumber
   */

  originalCylinderNumber:string

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
  cylinderType:{type:Schema.Types.ObjectId},

  waterCapacity:{type:String},

  dateManufactured:{type:Date},

  assignedTo:{type:Schema.Types.ObjectId},

  gasType:{type:Schema.Types.ObjectId},

  standardColor:{type:String},

  assignedNumber:{type:String},

  testingPresure:{type:String},

  fillingPreasure:{type:String},

  gasVolumeContent:{type:String},

  originalCylinderNumber:{type:String}
},{
  timestamps:true
});

export default function factory(conn:Connection): Model<RegisteredCylinderInterface> {
  return conn.model('registered-cylinders', registerCylinderSchema);
}
