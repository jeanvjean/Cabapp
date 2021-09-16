import {
  Model,
  Document,
  Schema,
  Connection
} from 'mongoose';
import { CylinderCondition } from './cylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { WalkinCustomerStatus } from './walk-in-customers';
import { SupplierTypes } from './supplier';

export enum TypesOfCylinders {
  BUFFER="buffer",
  ASSIGNED="assigned",
  DAMAGED="damaged",
  REPAIR="repair"
}

export enum cylinderHolder {
  CUSTOMER = "customer",
  ASNL = "asnl",
  SUPPLIER = "supplier",
  BRANCH = "other-branch"
}

export interface CylinderTracking{
  location:string,
  name:string
  heldBy:string
  date:string
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

  gasName:string

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

  holder:cylinderHolder

  /**
   * @param condition cylinder condition
   */

  condition:CylinderCondition

  cylinderStatus:WalkinCustomerStatus

  branch:Schema.Types.ObjectId

  fromBranch:Schema.Types.ObjectId

  department:string

  tracking:CylinderTracking[]

  holdingTime:Date

  cylNo:number

  available:boolean

  purchaseCost:number

  purchaseDate:number

  supplier:Schema.Types.ObjectId

  supplierType:SupplierTypes

  owner: cylinderHolder

  /**
   * @param createdAt
   */

  createdAt: Date

  /**
   * @param updatedAt
   */

  updatedAt: Date

}

const trackingSchema = new Schema({
  location:String,
  heldBy:String,
  name:String,
  date:Date
});

export const registerCylinderSchema = new Schema({
  cylinderType:{type:String, enum:Object.values(TypesOfCylinders), default:TypesOfCylinders.BUFFER},

  waterCapacity:{type:String},

  dateManufactured:{type:Date},

  assignedTo:{type:Schema.Types.ObjectId, ref:'customer'},

  gasType:{type:Schema.Types.ObjectId, ref:'cylinder'},

  gasName:{type:String},

  standardColor:{type:String},

  assignedNumber:{type:String},

  testingPresure:{type:String},

  fillingPreasure:{type:String},

  gasVolumeContent:{type:String},

  cylinderNumber:{type:String},

  condition:{type:String, enum:Object.values(CylinderCondition), default:CylinderCondition.GOOD},

  branch:{type:Schema.Types.ObjectId, ref:'branches'},

  fromBranch:{type:Schema.Types.ObjectId, ref:'branches'},

  holdingTime:{type:Date},

  department:{type:String},

  holder:{type:String, enum:Object.values(cylinderHolder), default:cylinderHolder.ASNL},

  cylinderStatus:{type:String, enum:Object.values(WalkinCustomerStatus), default:WalkinCustomerStatus.EMPTY},

  cylNo:{type:Number},

  available:{type:Boolean, default:true},

  purchaseCost:{type:Number},

  purchaseDate:{type:Date},

  supplier:{type:Schema.Types.ObjectId, ref:'supplier'},

  supplierType:{type:String, enum:Object.values(SupplierTypes)},

  owner:{type:String, enum:Object.values(cylinderHolder) },

  tracking:[trackingSchema]
},{
  timestamps:true
});

registerCylinderSchema.plugin(mongoosePaginate);
registerCylinderSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection): Model<RegisteredCylinderInterface> {
  return conn.model('registered-cylinders', registerCylinderSchema);
}
