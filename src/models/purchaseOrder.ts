import {
Schema,
Model,
Document,
Connection
} from 'mongoose';
import { commentInterface, ApprovalOfficers, stagesOfApproval, TransferStatus, ApprovalStatus, commentSchema, ApprovalOfficerSchema } from './transferCylinder';

import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export type purchaseCylinderInterface = {
    cylinderNo:string
    volume:string
}

export enum purchaseType {
    INTERNAL='internal',
    EXTERNAL='external'
}


export interface PurchaseOrderInterface extends Document{
    customer:string
    type:purchaseType
    date:Date
    cylinders:purchaseCylinderInterface[]
    comments:commentInterface[]
    approvalOfficers:ApprovalOfficers[]
    nextApprovalOfficer:Schema.Types.ObjectId
    approvalStage:stagesOfApproval
    approvalStatus:TransferStatus
    branch:Schema.Types.ObjectId,
    initiator:Schema.Types.ObjectId
}

export const cylinderSchema = new Schema({
    cylinderNo:String,
    volume:String
});

const purchaseOrderSchema = new Schema({
    customer:{type:String, required:true},
    date:Date,
    type:{type:String, enum:Object.values(purchaseType), required:true},
    cylinders:{type:[cylinderSchema]},
    comments:{type:[commentSchema]},
    approvalOfficers:{type:[ApprovalOfficerSchema]},
    nextApprovalOfficer:{type:Schema.Types.ObjectId, ref:'User'},
    approvalStage:{type:String, default:stagesOfApproval.STAGE1},
    approvalStatus:{type:String, default:TransferStatus.PENDING},
    branch:{type:Schema.Types.ObjectId, ref:'branches'},
    initiator:{type:Schema.Types.ObjectId, ref:'User'}
},{
    timestamps:true
});

purchaseOrderSchema.plugin(mongoosePaginate);
purchaseOrderSchema.plugin(aggregatePaginate)

export default function factory(conn:Connection):Model<PurchaseOrderInterface>{
    return conn.model('purchase order', purchaseOrderSchema);
}
