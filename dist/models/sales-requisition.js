"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const saleCylinderSchema = new mongoose_1.Schema({
    noOfCylinders: Number,
    volume: String,
    unitPrice: Number,
    amount: Number
});
const salesReqSchema = new mongoose_1.Schema({
    customerName: { type: String },
    ecrNo: { type: String },
    date: { type: Date },
    cylinders: [saleCylinderSchema],
    tracking: [transferCylinder_1.approvalStageShema],
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    approvalStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval), default: transferCylinder_1.stagesOfApproval.START },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    status: { type: String, enum: Object.values(transferCylinder_1.TransferStatus), default: transferCylinder_1.TransferStatus.PENDING },
    preparedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    initiated: { type: Boolean, default: false },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('sales-requisition', salesReqSchema);
}
exports.default = factory;
;
//# sourceMappingURL=sales-requisition.js.map