import {
  Schema,
  Model,
  Document,
  Connection,
  model
} from "mongoose";

export enum cylinderTypes{
  BUFFER = "buffer",
  ASSIGNED = "assigned"
}

export enum CylinderCondition{
  REPAIR='repair',
  DAMAGED='condemned',
  FAULTY="faulty",
  GOOD="good"
}

export interface CylinderInterface extends Document {

  /**
   * @param gasName  cylinder name
   */
  gasName:string,

  /**
   * @param colorCode cylinder color code
   */

  colorCode:string,

  /**
   * @param creator who created this cylinder;
   */

  creator:string,

  /**
   * @param type cylinder type by default its buffer
   */

  type: string,

  /**
   * @param condeition cylinder condition (damaged, repair, etc)
   */

  condeition:string

    /**
     * @param createdAt date created
     */

  createdAt:Date,

  /**
   * @param updatedAt date updated
   */

  updatedAt:Date,

}

export const cylinderSchema = new Schema({
  gasName:{type:String, required:true},
  colorCode:{type:String, required:true},
  creator:{type:Schema.Types.ObjectId},
  type:{
    type:String,
    enum:[cylinderTypes.BUFFER, cylinderTypes.ASSIGNED],
    default:cylinderTypes.BUFFER
  },
  condition:{type:String,enum:Object.values(CylinderCondition)}
},
{
  timestamps:true
});

export default function factory(conn:Connection):Model<CylinderInterface> {
  return conn.model('cylinder', cylinderSchema);
}
