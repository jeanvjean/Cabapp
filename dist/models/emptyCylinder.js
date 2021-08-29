"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionSchedule = exports.EcrApproval = exports.Priority = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var Priority;
(function (Priority) {
    Priority[Priority["URGENT"] = 1] = "URGENT";
    Priority[Priority["REGULAR"] = 2] = "REGULAR";
})(Priority = exports.Priority || (exports.Priority = {}));
var EcrApproval;
(function (EcrApproval) {
    EcrApproval["PENDING"] = "pending";
    EcrApproval["APPROVED"] = "approved";
    EcrApproval["REJECTED"] = "rejected";
})(EcrApproval = exports.EcrApproval || (exports.EcrApproval = {}));
var ProductionSchedule;
(function (ProductionSchedule) {
    ProductionSchedule["NEXT"] = "next";
    ProductionSchedule["PENDING"] = "pending";
    ProductionSchedule["SCHEDULED"] = "scheduled";
})(ProductionSchedule = exports.ProductionSchedule || (exports.ProductionSchedule = {}));
;
const ecrSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: "customer" },
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "registered-cylinders" }],
    priority: { type: Number, enum: Object.values(Priority), default: Priority.REGULAR },
    ApprovalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: Object.values(EcrApproval), default: EcrApproval.PENDING },
    scheduled: { type: Boolean, default: false },
    position: { type: String, enum: Object.values(ProductionSchedule), default: ProductionSchedule.PENDING },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    initNum: Number,
    ecrNo: String,
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }
});
ecrSchema.plugin(aggregatePaginate);
ecrSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('empty-cylinders', ecrSchema);
}
exports.default = factory;
;
//# sourceMappingURL=emptyCylinder.js.map