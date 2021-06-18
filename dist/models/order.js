"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderType = exports.pickupType = exports.PickupStatus = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var PickupStatus;
(function (PickupStatus) {
    PickupStatus["PENDING"] = "pending";
    PickupStatus["DONE"] = "done";
})(PickupStatus = exports.PickupStatus || (exports.PickupStatus = {}));
var pickupType;
(function (pickupType) {
    pickupType["SUPPLIER"] = "supplier";
    pickupType["CUSTOMER"] = "customer";
})(pickupType = exports.pickupType || (exports.pickupType = {}));
;
var orderType;
(function (orderType) {
    orderType["PICKUP"] = "pick-up";
    orderType["DELIVERY"] = "delivery";
})(orderType = exports.orderType || (exports.orderType = {}));
const trackingSchema = new mongoose_1.Schema({
    location: String,
    status: String
});
const OrderSchema = new mongoose_1.Schema({
    pickupType: { type: String, enum: Object.values(pickupType) },
    pickupDate: Date,
    status: { type: String, enum: Object.values(PickupStatus), default: PickupStatus.PENDING },
    numberOfCylinders: Number,
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    vehicle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'vehicle' },
    cylinderSize: { type: String },
    gasType: { type: mongoose_1.Schema.Types.ObjectId, ref: 'cylinder' },
    gasColor: { type: String },
    tracking: [trackingSchema],
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    orderType: { type: String, enum: Object.values(orderType) }
}, {
    timestamps: true
});
OrderSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('orders', OrderSchema);
}
exports.default = factory;
;
//# sourceMappingURL=order.js.map