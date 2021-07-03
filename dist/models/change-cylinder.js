"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const registeredCylinders_1 = require("./registeredCylinders");
const transferCylinder_1 = require("./transferCylinder");
const cylinderChangeSchem = new mongoose_1.Schema({
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'registered-cylinders' }],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    tracking: [transferCylinder_1.approvalStageShema],
    approvalStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval), default: transferCylinder_1.stagesOfApproval.STAGE1 },
    approvalStatus: { type: String, enum: Object.values(transferCylinder_1.TransferStatus), default: transferCylinder_1.TransferStatus.PENDING },
    comments: [transferCylinder_1.commentSchema],
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    gasType: { type: mongoose_1.Schema.Types.ObjectId, ref: 'cylinder' },
    cylinderType: { type: String, enum: Object.values(registeredCylinders_1.TypesOfCylinders) },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "customer" }
}, {
    timestamps: true
});
cylinderChangeSchem.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('change-cylinder', cylinderChangeSchem);
}
exports.default = factory;
//# sourceMappingURL=change-cylinder.js.map