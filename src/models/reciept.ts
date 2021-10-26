import {
Schema,
Model,
Document,
Connection
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { productRecievedSchema, ReceivedProduct } from './receivedProduct';
import { saleCylinder, saleCylinderSchema } from './sales-requisition';

export enum receiptType {
  PRODUCT = "product",
  CYLINDER = "cylinder"
}

export enum CustomerType{
  WALKIN="walk-in",
  REGISTERED = "regular"
}

export enum paymentMode {
    CASH='cash',
    BANK_TRANSFER='bank transfer',
    DEBIT_CARD='debit card'
}

export interface RecieptInterface extends Document{
    customer:string
    recieptType:receiptType
    cylinders?:saleCylinder[],
    products?:ReceivedProduct[]
    invoiceNo:string
    invInit:number
    totalAmount:number
    amountPaid:number
    outstandingBalance:number
    paymentMode:paymentMode
    date:Date
    preparedBy:Schema.Types.ObjectId
    amountInWords:string
    branch:Schema.Types.ObjectId,
    salesReq?:Schema.Types.ObjectId
}

const recieptSchema = new Schema({
    customer:{type:String},
    recieptType:{type:String, enum:Object.values(receiptType)},
    customerType:{type:String, enum:Object.values(CustomerType)},
    cylinders:[{type:saleCylinderSchema}],
    products:{type:[productRecievedSchema]},
    invoiceNo:{type:String},
    invInit:{type:Number},
    totalAmount:{type:Number},
    amountPaid:{type:Number},
    outstandingBalance:{type:Number},
    paymentMode:{type:String, enum:Object.values(paymentMode)},
    date:{type:Date},
    preparedBy:{type:Schema.Types.ObjectId, ref:'User'},
    amountInWords:{type:String},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    orderInfo:{
      orderId:{type:String},
      orderType:{type:String}
    },
    salesReq:{type:Schema.Types.ObjectId, ref:'sales-requisition'}
},{
    timestamps:true
});

recieptSchema.plugin(mongoosePaginate)
recieptSchema.plugin(aggregatePaginate)


export default function factory(conn:Connection):Model<RecieptInterface>{
    return conn.model('reciept', recieptSchema);
}
