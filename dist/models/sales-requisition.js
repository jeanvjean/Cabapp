"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleCylinderSchema = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const customer_1 = require("./customer");
exports.saleCylinderSchema = new mongoose_1.Schema({
    noOfCylinders: Number,
    cylinderNumber: String,
    volume: {
        value: Number,
        unit: String
    },
    unitPrice: Number,
    amount: Number,
    cylinderType: String
});
const salesReqSchema = new mongoose_1.Schema({
    customer: {
        name: String,
        email: String,
        id: mongoose_1.Schema.Types.ObjectId
    },
    ecrNo: { type: String },
    date: { type: Date },
    cylinders: [exports.saleCylinderSchema],
    tracking: [transferCylinder_1.approvalStageShema],
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval), default: transferCylinder_1.stagesOfApproval.START },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    status: { type: String, enum: Object.values(transferCylinder_1.TransferStatus), default: transferCylinder_1.TransferStatus.PENDING },
    preparedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    initiated: { type: Boolean, default: false },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    cyliderType: String,
    type: { type: String, enum: Object.values(customer_1.CustomerType) },
    production_id: mongoose_1.Schema.Types.ObjectId,
    purchase_id: mongoose_1.Schema.Types.ObjectId,
    invoice_id: mongoose_1.Schema.Types.ObjectId,
    fcr_id: mongoose_1.Schema.Types.ObjectId
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