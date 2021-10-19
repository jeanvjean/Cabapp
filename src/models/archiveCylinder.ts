import {
  Schema,
  Connection,
  Model,
  Document
} from 'mongoose';
import { CylinderCondition } from './cylinder';

import * as mongoosePagination from 'mongoose-paginate-v2';

import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface ArchivedCylinder extends Document{
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
     waterCapacity:{
      value:number,
      unit:string
    }

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

     gasVolumeContent:{
      value:number,
      unit:string
    }

     /**
      * @param cylinderNumber
      */

     cylinderNumber:string

     /**
      * @param condition cylinder condition
      */

     condition:CylinderCondition

     branch:Schema.Types.ObjectId

     department:string

     holdingTime:Date

     purchaseCost:{
      cost:number,
      unit:string
    }

     /**
      * @param createdAt
      */

     createdAt: Date

     /**
      * @param updatedAt
      */

     updatedAt: Date
}

export const archiveCylinderSchema = new Schema({
  cylinderType:{type:String},

  waterCapacity:{
    value:Number,
    unit:String
  },

  dateManufactured:{type:Date},

  assignedTo:{type:Schema.Types.ObjectId, ref:'customer'},

  gasType:{type:String},

  standardColor:{type:String},

  assignedNumber:{type:String},

  testingPresure:{type:String},

  fillingPreasure:{type:String},

  gasVolumeContent:{
    value:Number,
    unit:String
  },

  cylinderNumber:{type:String},

  condition:{type:String},

  branch:{type:Schema.Types.ObjectId, ref:'branches'},

  holdingTime:{type:Date},

  department:{type:String},

  purchaseCost:{
    cost:Number,
    unit:String
  },
});

archiveCylinderSchema.plugin(mongoosePagination)
archiveCylinderSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<ArchivedCylinder> {
  return conn.model('archive-cylinders', archiveCylinderSchema);
}
