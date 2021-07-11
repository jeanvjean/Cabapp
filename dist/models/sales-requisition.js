"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleCylinderSchema = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
exports.saleCylinderSchema = new mongoose_1.Schema({
    noOfCylinders: Number,
    volume: String,
    unitPrice: Number,
    amount: Number
});
const salesReqSchema = new mongoose_1.Schema({
    customerName: { type: String },
    ecrNo: { type: String },
    date: { type: Date },
    cylinders: [exports.saleCylinderSchema],
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
salesReqSchema.plugin(mongoosePaginate);
salesReqSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('sales-requisition', salesReqSchema);
}
exports.default = factory;
;
//# sourceMappingURL=sales-requisition.js.map