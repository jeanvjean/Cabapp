import {
    Schema,
    Document,
    Model,
    Connection
} from 'mongoose';




export interface TerretoryInterface extends Document{
    name: string,
    branch:Schema.Types.ObjectId,
    createdAt:Date
    updatedAt:Date
}


const teretorySchema = new Schema({
    name:{type:String, required:true},
    branch:{type:Schema.Types.ObjectId, ref:'branches'}
}, {
    timestamps:true
});

export default function factory(conn:Connection):Model<TerretoryInterface>{
    return conn.model('terretory', teretorySchema);
}