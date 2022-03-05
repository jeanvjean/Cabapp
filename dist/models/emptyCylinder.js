"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionSchedule = exports.EcrApproval = exports.EcrType = exports.Priority = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const driverPickup_1 = require("./driverPickup");
var Priority;
(function (Priority) {
    Priority[Priority["URGENT"] = 1] = "URGENT";
    Priority[Priority["REGULAR"] = 2] = "REGULAR";
    Priority[Priority["TRUCK"] = 3] = "TRUCK";
    Priority[Priority["COMPLAINT"] = 4] = "COMPLAINT";
})(Priority = exports.Priority || (exports.Priority = {}));
var EcrType;
(function (EcrType) {
    EcrType["TRUCK"] = "truck";
    EcrType["SALES"] = "sales";
    EcrType["COMPLAINT"] = "complaint";
    EcrType["FILLED"] = "filled";
})(EcrType = exports.EcrType || (exports.EcrType = {}));
var EcrApproval;
(function (EcrApproval) {
    EcrApproval["PENDING"] = "pending";
    EcrApproval["APPROVED"] = "approved";
    EcrApproval["REJECTED"] = "rejected";
    EcrApproval["TRUCK"] = "truck";
})(EcrApproval = exports.EcrApproval || (exports.EcrApproval = {}));
var ProductionSchedule;
(function (ProductionSchedule) {
    ProductionSchedule["NEXT"] = "next";
    ProductionSchedule["PENDING"] = "pending";
    ProductionSchedule["SCHEDULED"] = "scheduled";
    ProductionSchedule["TRUCK"] = "truck";
})(ProductionSchedule = exports.ProductionSchedule || (exports.ProductionSchedule = {}));
;
const ecrSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: "customer" },
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "registered-cylinders" }],
    fringeCylinders: [driverPickup_1.routeCylinderSchema],
    type: { type: String, enum: Object.values(EcrType) },
    gasType: { type: mongoose_1.Schema.Types.ObjectId, ref: "cylinder" },
    icnNo: String,
    priority: { type: Number, enum: Object.values(Priority), default: Priority.REGULAR },
    ApprovalOfficers: [transferCylinder_1.ApprovalOfficerSchema],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: Object.values(EcrApproval), default: EcrApproval.PENDING },
    scheduled: { type: Boolean, default: false },
    position: { type: String, enum: Object.values(ProductionSchedule), default: ProductionSchedule.PENDING },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    initNum: Number,
    ecrNo: String,
    fcrNo: String,
    tfcrNo: String,
    tecrNo: String,
    initiator: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    reason: String,
    driverStatus: { type: String, enum: Object.values(EcrApproval), default: EcrApproval.PENDING },
    waybillNo: String,
    otp: String,
    closed: { type: Boolean, default: false },
    recieversPhone: String,
    totalVolume: {
        value: Number,
        unit: String
    },
    totalQuantity: String,
    icn_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "out-going-cylinders" },
    removeArr: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "registered-cylinders" }],
    sales_req_id: mongoose_1.Schema.Types.ObjectId,
    modeOfService: String
}, {
    timestamps: true
});
ecrSchema.plugin(aggregatePaginate);
ecrSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('empty-cylinders', ecrSchema);
}
exports.default = factory;
;
//# sourceMappingURL=emptyCylinder.js.map