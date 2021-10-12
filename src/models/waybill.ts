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
    customer:string
    cylinders: purchaseCylinderInterface[]
    invoiceNo: string
    lpoNo:string
    deliveryType:pickupType,
    branch:Schema.Types.ObjectId
    numInit:number
    deliveryNo:string
}

const waybillSchema = new Schema({
    customer:{type:String, required:true},
    cylinders: [cylinderSchema],
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