import {
    Schema,
    Model,
    Document,
    Connection
} from 'mongoose';
import { pickupType } from './order';
import { cylinderSchema, purchaseCylinderInterface } from './purchaseOrder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface WayBillInterface extends Document{
    customer:{
        name:string,
        email:string,
        id:Schema.Types.ObjectId,
    }
    // cylinders: purchaseCylinderInterface[]
    cylinders: Schema.Types.ObjectId[]
    ocn:Schema.Types.ObjectId
    invoiceNo: string
    lpoNo:string
    deliveryType:pickupType,
    branch:Schema.Types.ObjectId
    numInit:number
    deliveryNo:string
}

const waybillSchema = new Schema({
    customer:{
        name:String,
        id:Schema.Types.ObjectId,
        email:String
    },
    ocn:{type:Schema.Types.ObjectId, ref:"out-going-cylinders"},
    cylinders: [{type:Schema.Types.ObjectId, ref:'registered-cylinders'}],
    invoiceNo: {type:String},
    lpoNo:{type:String},
    deliveryType:{type: String, enum:Object.values(pickupType)},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    numInit:Number,
    deliveryNo:String
},{
    timestamps:true
})

waybillSchema.plugin(mongoosePaginate);
waybillSchema.plugin(aggregatePaginate);

export default function(conn:Connection):Model<WayBillInterface>{
    return conn.model('waybill', waybillSchema)
}