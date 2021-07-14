"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const ocnCylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    volume: String,
    unitPrice: Number,
    price: Number
});
const ocnSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    cylinderType: { type: String },
    date: { type: Date },
    cylinders: { type: [ocnCylinderSchema] },
    totalQty: { type: Number },
    totalVol: { type: String },
    totalAmount: { type: Number },
    approvalOfficers: { type: [transferCylinder_1.approvalStageShema] },
    approvalStage: { type: String, enum: Object.values(transferCylinder_1.stagesOfApproval), default: transferCylinder_1.stagesOfApproval.STAGE1 },
    approvalStatus: { type: String, enum: Object.values(transferCylinder_1.TransferStatus), default: transferCylinder_1.TransferStatus.PENDING },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    ocnNo: { type: String },
    ocnInit: Number
});
ocnSchema.plugin(mongoosePaginate);
ocnSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('out-going-cylinders', ocnSchema);
}
exports.default = factory;
//# sourceMappingURL=ocn.js.map