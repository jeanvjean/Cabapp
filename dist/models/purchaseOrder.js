"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cylinderSchema = exports.purchaseType = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var purchaseType;
(function (purchaseType) {
    purchaseType["INTERNAL"] = "internal";
    purchaseType["EXTERNAL"] = "external";
})(purchaseType = exports.purchaseType || (exports.purchaseType = {}));
exports.cylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    volume: {
        value: Number,
        unit: String
    }
});
const purchaseOrderSchema = new mongoose_1.Schema({
    date: Date,
    gasType: String,
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    type: { type: String, enum: Object.values(purchaseType), required: true },
    cylinders: { type: [exports.cylinderSchema] },
    comments: { type: [transferCylinder_1.commentSchema] },
    approvalOfficers: { type: [transferCylinder_1.ApprovalOfficerSchema] },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvalStage: { type: String, default: transferCylinder_1.stagesOfApproval.STAGE1 },
    approvalStatus: { type: String, default: transferCylinder_1.TransferStatus.PENDING },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    fromBranch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    initNum: Number,
    orderNumber: String
}, {
    timestamps: true
});
purchaseOrderSchema.plugin(mongoosePaginate);
purchaseOrderSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('purchase order', purchaseOrderSchema);
}
exports.default = factory;
//# sourceMappingURL=purchaseOrder.js.map