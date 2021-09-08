"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleSchema = exports.RoutePlanStatus = exports.RouteActivity = exports.InspectApproval = exports.maintType = void 0;
const mongoose_1 = require("mongoose");
const transferCylinder_1 = require("./transferCylinder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var maintType;
(function (maintType) {
    maintType["CORRECTIVE"] = "corrective";
    maintType["PREINSPECTION"] = "pre-inspection";
})(maintType = exports.maintType || (exports.maintType = {}));
var InspectApproval;
(function (InspectApproval) {
    InspectApproval["APPROVED"] = "approved";
    InspectApproval["REJECTED"] = "rejected";
    InspectApproval["PENDING"] = "pending";
})(InspectApproval = exports.InspectApproval || (exports.InspectApproval = {}));
var RouteActivity;
(function (RouteActivity) {
    RouteActivity["PICKUP"] = "pick-up";
    RouteActivity["DELIVERY"] = "delivery";
})(RouteActivity = exports.RouteActivity || (exports.RouteActivity = {}));
var RoutePlanStatus;
(function (RoutePlanStatus) {
    RoutePlanStatus["PROGRESS"] = "in-progress";
    RoutePlanStatus["DONE"] = "done";
})(RoutePlanStatus = exports.RoutePlanStatus || (exports.RoutePlanStatus = {}));
const replacedItemSchema = new mongoose_1.Schema({
    name: String,
    qty: Number,
    unitCost: Number,
    totalCost: Number
});
const routeSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    startDate: Date,
    endDate: Date,
    activity: { type: String, enum: Object.values(RouteActivity) },
    destination: String,
    departure: String,
    status: { type: String, enum: Object.values(RoutePlanStatus) }
});
const maintainaceSchema = new mongoose_1.Schema({
    type: { type: String, enum: Object.values(maintType) },
    operation: String,
    cost: Number,
    date: Date,
    curMileage: { type: String },
    prevMileage: { type: String },
    itemsReplaced: [replacedItemSchema],
    comments: [transferCylinder_1.commentSchema],
    approvalStatus: { type: String },
    approvalStage: { type: String },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    recomendedMech: String,
    referer: String,
}, {
    timestamps: true
});
const disposalSchema = new mongoose_1.Schema({
    disposalDate: { type: Date },
    disposalAmount: { type: Number },
    disposalMileage: { type: String }
}, {
    timestamps: true
});
exports.vehicleSchema = new mongoose_1.Schema({
    vehicleType: { type: String },
    manufacturer: { type: String },
    vModel: { type: String },
    regNo: { type: String },
    acqisistionDate: { type: Date },
    mileageDate: { type: Date },
    currMile: { type: String },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    vehCategory: { type: String },
    tankCapacity: { type: String },
    batteryCapacity: { type: String },
    fuelType: { type: String },
    grossHeight: { type: String },
    netWeight: { type: String },
    disposal: disposalSchema,
    maintainace: { type: [maintainaceSchema] },
    routes: [routeSchema],
    licence: { type: String },
    insuranceDate: { type: String },
    lastMileage: { type: String },
    comments: [transferCylinder_1.commentSchema],
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
exports.vehicleSchema.plugin(mongoosePaginate);
exports.vehicleSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('vehicle', exports.vehicleSchema);
}
exports.default = factory;
//# sourceMappingURL=vehicle.js.map