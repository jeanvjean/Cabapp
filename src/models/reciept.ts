import {
Schema,
Model,
Document,
Connection
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import { productRecievedSchema, ReceivedProduct } from './receivedProduct';
import { saleCylinder, saleCylinderSchema } from './sales-requisition';

export enum receiptType {
  PRODUCT = "product",
  CYLINDER = "cylinder"
}

export enum CustomerType{
  WALKIN="walk-in",
  REGISTERED = "registered"
}

export enum paymentMode {
    CASH='cash',
    BANK_TRANSFER='bank transfer',
    DEBIT_CARD='debit card'
}

export interface RecieptInterface extends Document{
    customer:string
    cylinderType:string
    type:receiptType
    cylinders?:saleCylinder[],
    products?:ReceivedProduct[]
    invoiceNo:number
    totalAmount:number
    amountPaid:number
    outstandingBalance:number
    paymentMode:paymentMode
    date:Date
    preparedBy:Schema.Types.ObjectId
    amountInWords:string
    branch:Schema.Types.ObjectId
}

const recieptSchema = new Schema({
    customer:{type:String},
    cylinderType:{type:String},
    recieptType:{type:String, enum:Object.values(receiptType)},
    customerType:{type:String, enum:Object.values(CustomerType)},
    cylinders:{type:[saleCylinderSchema]},
    products:{type:[productRecievedSchema]},
    invoiceNo:{type:Number},
    totalAmount:{type:Number},
    amountPaid:{type:Number},
    outstandingBalance:{type:Number},
    paymentMode:{type:String, enum:Object.values(paymentMode)},
    date:{type:Date},
    preparedBy:{type:Schema.Types.ObjectId, ref:'User'},
    amountInWords:{type:String},
    branch:{type:Schema.Types.ObjectId, ref:'branches'}
},{
    timestamps:true
});

recieptSchema.plugin(mongoosePaginate)


export default function factory(conn:Connection):Model<RecieptInterface>{
    return conn.model('reciept', recieptSchema);
}
