"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const cylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    volume: String
});
const purchaseOrderSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    date: Date,
    cylinders: { type: [cylinderSchema] },
    comments: { type: transferCylinder_1.commentSchema },
    approvalOfficer: { type: [transferCylinder_1.ApprovalOfficerSchema] },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    approvalStage: { type: String, default: transferCylinder_1.stagesOfApproval.STAGE1 },
    approvalStatus: { type: String, default: transferCylinder_1.TransferStatus.PENDING },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('purchase order', purchaseOrderSchema);
}
exports.default = factory;
//# sourceMappingURL=purchaseOrder.js.map