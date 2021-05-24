"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PickupStatus = void 0;
const mongoose_1 = require("mongoose");
var PickupStatus;
(function (PickupStatus) {
    PickupStatus["PENDING"] = "pending";
    PickupStatus["DONE"] = "done";
})(PickupStatus = exports.PickupStatus || (exports.PickupStatus = {}));
const trackingSchema = new mongoose_1.Schema({
    location: String,
    status: String
});
const OrderSchema = new mongoose_1.Schema({
    pickupType: String,
    pickupDate: Date,
    status: { type: String, enum: Object.values(PickupStatus), default: PickupStatus.PENDING },
    numberOfCylinders: Number,
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    vehicle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'vehicle' },
    cylinderSize: { type: String },
    gasType: { type: String },
    gasColor: { type: String },
    tracking: [trackingSchema],
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'vehicle' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('orders', OrderSchema);
}
exports.default = factory;
;
//# sourceMappingURL=order.js.map