"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintSchema = exports.complaintStatus = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
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
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String },
    issue: { type: String },
    complaint: { type: String },
    cylinders: [complaintCylinderSchema],
    status: { type: String, enum: Object.values(complaintStatus), default: complaintStatus.PENDING },
    approvalStage: { type: String },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    comments: [transferCylinder_1.commentSchema],
    approvalStatus: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    complaintType: { type: String },
    replaceCylinder: [{ type: cylinderReplaceSchema }],
    icnNo: String,
    ecrNo: String
}, {
    timestamps: true
});
exports.complaintSchema.plugin(mongoosePaginate);
exports.complaintSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('complaint', exports.complaintSchema);
}
exports.default = factory;
//# sourceMappingURL=complaint.js.map