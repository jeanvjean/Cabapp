import {
    Schema, 
    Document, 
    Connection, 
    Model
} from 'mongoose';

import * as mongoosPaginate from 'mongoose-paginate-v2';

interface cylinderInterface {
    cylinderNumber:string,
    assignedNumber:string
    barcode:string
}

export enum scanStatus {
    ON_GOING='in-progress',
    COMPLETE="completed"
}

export interface ScanInterface extends Document {
    formId:string,
    cylinders: cylinderInterface[],
    initNum:number
    status:scanStatus
}

const scanCylinderSchema = new Schema({
    cylinderNumber:String,
    assignedNumber:String,
    barcode:String
})

const scanSchema = new Schema({
    formId:String,
    cylinders:[scanCylinderSchema],
    initNum:Number,
    status: {type:String, enum:Object.values(scanStatus), default:scanStatus.ON_GOING}
});

scanSchema.plugin(mongoosPaginate);

export default function factory(conn:Connection):Model<ScanInterface>{
    return conn.model('scan', scanSchema);
}