import {
Schema,
Model,
Document,
Connection
} from 'mongoose';
import { commentInterface, ApprovalOfficers, stagesOfApproval, TransferStatus, ApprovalStatus, commentSchema, ApprovalOfficerSchema } from './transferCylinder';


export type purchaseCylinderInterface = {
    cylinderNo:string
    volume:string
}


export interface PurchaseOrderInterface extends Document{
    customer:Schema.Types.ObjectId
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

const cylinderSchema = new Schema({
    cylinderNo:String,
    volume:String
});

const purchaseOrderSchema = new Schema({
    customer:{type:Schema.Types.ObjectId, ref:'customer'},
    date:Date,
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

export default function factory(conn:Connection):Model<PurchaseOrderInterface>{
    return conn.model('purchase order', purchaseOrderSchema);
}
