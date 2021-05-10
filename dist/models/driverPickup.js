"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const vehicle_1 = require("./vehicle");
const routeCylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    cylinderSize: String,
    totalVolume: String,
    totalQuantity: String
});
const routeSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    startDate: { type: Date },
    endDate: { type: Date },
    activity: { type: String, enum: Object.values(vehicle_1.RouteActivity) },
    destination: { type: String },
    departure: { Type: String },
    status: { type: String, enum: Object.values(vehicle_1.RoutePlanStatus) },
    ecrNo: { type: String },
    icnNo: { type: String },
    orderType: { type: String },
    modeOfService: { type: String },
    date: { type: Date },
    serialNo: { type: Number },
    cylinders: { type: [routeCylinderSchema] },
    vehicle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'vehicle' },
    recievedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    security: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('pickup-routes', routeSchema);
}
exports.default = factory;
//# sourceMappingURL=driverPickup.js.map