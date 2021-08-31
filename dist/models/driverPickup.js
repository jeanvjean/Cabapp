"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const order_1 = require("./order");
const vehicle_1 = require("./vehicle");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const routeCylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    cylinderSize: String,
    totalVolume: String,
    totalQuantity: String
});
const routeSupplier = new mongoose_1.Schema({
    name: String,
    destination: String,
    departure: String,
    numberOfCylinders: Number,
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'registered-cylinders' }],
    status: String,
    reportId: String
});
const routeCustomer = new mongoose_1.Schema({
    name: String,
    destination: String,
    departure: String,
    numberOfCylinders: Number,
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'registered-cylinders' }],
    status: String,
    reportId: String
});
const routeSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    customers: [routeCustomer],
    suppliers: [routeSupplier],
    startDate: { type: Date },
    endDate: { type: Date },
    activity: { type: String, enum: Object.values(vehicle_1.RouteActivity) },
    destination: { type: String },
    departure: { Type: String },
    status: { type: String, enum: Object.values(vehicle_1.RoutePlanStatus) },
    ecrNo: { type: String },
    icnNo: { type: String },
    ocnNo: { type: String },
    tecrNo: { type: String },
    tfcrNo: { type: String },
    orderType: { type: String, enum: Object.values(order_1.pickupType) },
    modeOfService: { type: String },
    date: { type: Date },
    serialNo: { type: Number },
    cylinders: { type: [routeCylinderSchema] },
    vehicle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'vehicle' },
    recievedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    security: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    deleted: { type: Boolean, default: false },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    dateCompleted: { type: Date },
    territory: { type: String },
    mileageIn: { type: String },
    mileageOut: { type: String },
    fuelGiven: { type: String },
    fuelsConsumed: { type: String },
    timeOut: { type: String },
    timeIn: { type: String }
}, {
    timestamps: true
});
routeSchema.plugin(mongoosePaginate);
routeSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('pickup-routes', routeSchema);
}
exports.default = factory;
//# sourceMappingURL=driverPickup.js.map