import {
Schema,
Model,
Document,
Connection
} from 'mongoose';
import { commentInterface, ApprovalOfficers, stagesOfApproval, TransferStatus, commentSchema, ApprovalOfficerSchema } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export type purchaseCylinderInterface = {
    cylinderNo:string
    volume:{
        value:number,
        unit:string
      }
}

export enum purchaseType {
    INTERNAL='internal',
    EXTERNAL='external'
}


export interface PurchaseOrderInterface extends Document{
    type:purchaseType
    gasType:string,
    supplier?:Schema.Types.ObjectId
    date:Date
    cylinders:purchaseCylinderInterface[]
    comments:commentInterface[]
    approvalOfficers:ApprovalOfficers[]
    nextApprovalOfficer:Schema.Types.ObjectId
    approvalStage:stagesOfApproval
    approvalStatus:TransferStatus
    branch:Schema.Types.ObjectId,
    initiator:Schema.Types.ObjectId    
    initNum:number,
    orderNumber:string
    fromBranch?:Schema.Types.ObjectId
}

export const cylinderSchema = new Schema({
    cylinderNo:String,
    volume:{
        value:Number,
        unit:String
    }
});

const purchaseOrderSchema = new Schema({
    date:Date,
    gasType:String,
    supplier:{type:Schema.Types.ObjectId, ref:'supplier'},
    type:{type:String, enum:Object.values(purchaseType), required:true},
    cylinders:{type:[cylinderSchema]},
    comments:{type:[commentSchema]},
    approvalOfficers:{type:[ApprovalOfficerSchema]},
    nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
    approvalStage:{type:String, default:stagesOfApproval.STAGE1},
    approvalStatus:{type:String, default:TransferStatus.PENDING},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    fromBranch:{type:Schema.Types.ObjectId, ref:'branches'},
    initiator:{type:Schema.Types.ObjectId, ref:'User'},
    initNum:Number,
    orderNumber:String
},{
    timestamps:true
});

purchaseOrderSchema.plugin(mongoosePaginate);
purchaseOrderSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<PurchaseOrderInterface>{
    return conn.model('purchase order', purchaseOrderSchema);
}
