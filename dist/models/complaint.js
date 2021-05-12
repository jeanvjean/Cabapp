"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintSchema = exports.complaintStatus = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
var complaintStatus;
(function (complaintStatus) {
    complaintStatus["RESOLVED"] = "resolved";
    complaintStatus["PENDING"] = "pending";
})(complaintStatus = exports.complaintStatus || (exports.complaintStatus = {}));
const complaintCylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    cylinderSize: String,
    dateSupplied: Date,
    waybillNo: String,
    totalVolume: String
});
const cylinderReplaceSchema = new mongoose_1.Schema({
    cylinderNo: String,
    cylinderSize: String,
    totalVolume: String
});
exports.complaintSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    title: { type: String },
    issue: { type: String },
    complaint: { type: String },
    cylinders: [complaintCylinderSchema],
    cylinderReplace: cylinderReplaceSchema,
    status: { type: String, enum: Object.values(complaintStatus), default: complaintStatus.PENDING },
    approvalStage: { type: String },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    comments: [transferCylinder_1.commentSchema],
    approvalStatus: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('complaint', exports.complaintSchema);
}
exports.default = factory;
//# sourceMappingURL=complaint.js.map