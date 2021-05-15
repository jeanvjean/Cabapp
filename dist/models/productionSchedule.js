"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
var productionStatus;
(function (productionStatus) {
    productionStatus["PENDING"] = "pending";
    productionStatus["FILLED"] = "filled";
})(productionStatus || (productionStatus = {}));
const productionCylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    volume: String,
    type: String,
    status: { type: String, enum: Object.values(productionStatus), default: productionStatus.PENDING }
});
const productionSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    productionNo: { type: String },
    ecrNo: { type: String },
    shift: { type: String },
    date: { type: Date },
    cylinders: { type: [productionCylinderSchema] },
    quantityToFill: { type: Number },
    volumeToFill: { type: String },
    totalQuantity: { type: Number },
    totalVolume: { type: String },
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: Object.values(transferCylinder_1.TransferStatus), derfault: transferCylinder_1.TransferStatus.PENDING },
    approvalStage: { type: String },
    comments: { type: [transferCylinder_1.commentSchema] },
    produced: { type: Boolean, default: false }
});
function factory(conn) {
    return conn.model('production-schedule', productionSchema);
}
exports.default = factory;
//# sourceMappingURL=productionSchedule.js.map