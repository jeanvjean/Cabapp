import {
    Schema,
    Document,
    Model,
    Connection
} from 'mongoose';


import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';


export interface vehiclePerformance extends Document {
    vehicle:Schema.Types.ObjectId,
    dateCompleted:Date
    dateStarted:Date
    departure:string
    client:string
    destination:string
    driver:string
    routeInfo:Schema.Types.ObjectId
    mileageIn:string
    mileageOut:string
    timeOut:Date
    timeIn:Date
}


const performanceSchema = new Schema({
    vehicle:{type:Schema.Types.ObjectId, ref:'vehicle'},
    dateCompleted:{type:Date},
    dateStarted:{type:Date},
    departure:{type:String},
    client:String,
    destination:{type:String},
    driver:String,
    routeInfo:{type:Schema.Types.ObjectId, ref:"pickup-routes"},
    mileageIn:String,
    mileageOut:String,
    timeOut:Date,
    timeIn:Date
},{
    timestamps:true
});

performanceSchema.plugin(mongoosePaginate);
performanceSchema.plugin(aggregatePaginate);

export default function factory(conn:Connection):Model<vehiclePerformance>{
    return conn.model('performance', performanceSchema);
}