import {
    Schema, 
    Document, 
    Model, 
    Connection
} from 'mongoose';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';


export interface DeletedUser extends Document{
    name:string
    email:string
    role:string
    department:string
    branch:Schema.Types.ObjectId
    reason:string
    createdAt:Date
    updatedAt:Date
}

const deletedUserSchema = new Schema({
    name:{type:String},
    email:{type:String},
    role:{type:String},
    department:{type:String},
    branch:{type:Schema.Types.ObjectId, ref:"branches"},
    reason:{type:String}
},{
    timestamps:true
});

deletedUserSchema.plugin(mongoosePaginate);
deletedUserSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<DeletedUser>{
    return conn.model('deleted_users', deletedUserSchema);
}