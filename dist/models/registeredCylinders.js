"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCylinderSchema = exports.cylinderHolder = exports.TypesOfCylinders = void 0;
const mongoose_1 = require("mongoose");
const cylinder_1 = require("./cylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const walk_in_customers_1 = require("./walk-in-customers");
const supplier_1 = require("./supplier");
var TypesOfCylinders;
(function (TypesOfCylinders) {
    TypesOfCylinders["BUFFER"] = "buffer";
    TypesOfCylinders["ASSIGNED"] = "assigned";
    TypesOfCylinders["DAMAGED"] = "damaged";
    TypesOfCylinders["REPAIR"] = "repair";
})(TypesOfCylinders = exports.TypesOfCylinders || (exports.TypesOfCylinders = {}));
var cylinderHolder;
(function (cylinderHolder) {
    cylinderHolder["CUSTOMER"] = "customer";
    cylinderHolder["ASNL"] = "asnl";
    cylinderHolder["SUPPLIER"] = "supplier";
    cylinderHolder["BRANCH"] = "other-branch";
})(cylinderHolder = exports.cylinderHolder || (exports.cylinderHolder = {}));
const trackingSchema = new mongoose_1.Schema({
    location: String,
    heldBy: String,
    name: String,
    date: Date
});
exports.registerCylinderSchema = new mongoose_1.Schema({
    cylinderType: { type: String, enum: Object.values(TypesOfCylinders), default: TypesOfCylinders.BUFFER },
    waterCapacity: { type: String },
    dateManufactured: { type: Date },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    gasType: { type: mongoose_1.Schema.Types.ObjectId, ref: 'cylinder' },
    gasName: { type: String },
    standardColor: { type: String },
    assignedNumber: { type: String },
    testingPresure: { type: String },
    fillingPreasure: { type: String },
    gasVolumeContent: { type: String },
    cylinderNumber: { type: String },
    condition: { type: String, enum: Object.values(cylinder_1.CylinderCondition), default: cylinder_1.CylinderCondition.GOOD },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    fromBranch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    holdingTime: { type: Date },
    department: { type: String },
    holder: { type: String, enum: Object.values(cylinderHolder), default: cylinderHolder.ASNL },
    cylinderStatus: { type: String, enum: Object.values(walk_in_customers_1.WalkinCustomerStatus), default: walk_in_customers_1.WalkinCustomerStatus.EMPTY },
    cylNo: { type: Number },
    available: { type: Boolean, default: true },
    purchaseCost: { type: Number },
    purchaseDate: { type: Date },
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    supplierType: { type: String, enum: Object.values(supplier_1.SupplierTypes) },
    owner: { type: String, enum: Object.values(cylinderHolder) },
    tracking: [trackingSchema]
}, {
    timestamps: true
});
exports.registerCylinderSchema.plugin(mongoosePaginate);
exports.registerCylinderSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('registered-cylinders', exports.registerCylinderSchema);
}
exports.default = factory;
//# sourceMappingURL=registeredCylinders.js.map