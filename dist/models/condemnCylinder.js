"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const condemSchema = new mongoose_1.Schema({
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'registered-cylinders' }],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    tracking: [transferCylinder_1.approvalStageShema],
    approvalStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval), default: transferCylinder_1.stagesOfApproval.STAGE1 },
    approvalStatus: { type: String, enum: Object.values(transferCylinder_1.TransferStatus), default: transferCylinder_1.TransferStatus.PENDING },
    comments: [transferCylinder_1.commentSchema],
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
condemSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('condemn', condemSchema);
}
exports.default = factory;
//# sourceMappingURL=condemnCylinder.js.map