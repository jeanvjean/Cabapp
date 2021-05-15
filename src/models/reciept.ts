import {
Schema, 
Model, 
Document, 
Connection
} from 'mongoose';


export enum paymentMode {
    CASH='cash',
    BANK_TRANSFER='bank transfer',
    DEBIT_CARD='debit card'
}

export interface RecieptInterface extends Document{
    customer:string
    cylinderType:string
    invoiceNo:number
    totalAmount:number
    amountPaid:number
    outstandingBalance:number
    paymentMode:paymentMode
    date:Date
    preparedBy:Schema.Types.ObjectId
    amountInWords:string
}

const recieptSchema = new Schema({
    customer:{type:String},
    cylinderType:{type:String},
    invoiceNo:{type:Number},
    totalAmount:{type:Number},
    amountPaid:{type:Number},
    outstandingBalance:{type:Number},
    paymentMode:{type:String, enum:Object.values(paymentMode)},
    date:{type:Date},
    preparedBy:{type:Schema.Types.ObjectId, ref:'User'},
    amountInWords:{type:String}
},{
    timestamps:true
});


export default function factory(conn:Connection):Model<RecieptInterface>{
    return conn.model('reciept', recieptSchema);
}