import {
    Schema, 
    Document, 
    Model, 
    Connection
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';


export interface DeletedCustomer extends Document{
    name:string
    email:string
    branch:Schema.Types.ObjectId
    reason:string
    type:string
    createdAt:Date
    updatedAt:Date
}

const deletedCustomerSchema = new Schema({
    name:{type:String},
    email:{type:String},
    branch:{type:Schema.Types.ObjectId, ref:"branches"},
    reason:{type:String},
    type:String
},{
    timestamps:true
});

deletedCustomerSchema.plugin(mongoosePaginate);
deletedCustomerSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<DeletedCustomer>{
    return conn.model('deleted_customers', deletedCustomerSchema);
}