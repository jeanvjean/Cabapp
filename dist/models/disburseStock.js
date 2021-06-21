"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disburseSchema = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const requesterSchema = new mongoose_1.Schema({
    requestingOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: mongoose_1.Schema.Types.ObjectId }
}, {
    timestamps: true
});
const disburseProductSchema = new mongoose_1.Schema({
    productNumber: { type: String },
    productName: { type: String },
    quantityRequested: { type: Number },
    quantityReleased: { type: Number },
    comment: { type: String }
});
exports.disburseSchema = new mongoose_1.Schema({
    products: [disburseProductSchema],
    releasedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    releasedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    comments: [transferCylinder_1.commentSchema],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval) },
    disburseStatus: { type: String, enum: Object.values(transferCylinder_1.TransferStatus) },
    requestStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval) },
    requestApproval: { type: String, enum: Object.values(transferCylinder_1.TransferStatus) },
    tracking: [transferCylinder_1.approvalStageShema],
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    fromBranch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    requestFrom: { type: requesterSchema },
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    jobTag: { type: String },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    mrn: { type: String },
    grnNo: { type: String }
});
exports.disburseSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('disburse-product', exports.disburseSchema);
}
exports.default = factory;
//# sourceMappingURL=disburseStock.js.map