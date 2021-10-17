"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const order_1 = require("./order");
const purchaseOrder_1 = require("./purchaseOrder");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const waybillSchema = new mongoose_1.Schema({
    customer: { type: String, required: true },
    cylinders: [purchaseOrder_1.cylinderSchema],
    invoiceNo: { type: String },
    lpoNo: { type: String },
    deliveryType: { type: String, enum: Object.values(order_1.pickupType) },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    numInit: Number,
    deliveryNo: String
}, {
    timestamps: true
});
waybillSchema.plugin(mongoosePaginate);
waybillSchema.plugin(aggregatePaginate);
function default_1(conn) {
    return conn.model('waybill', waybillSchema);
}
exports.default = default_1;
//# sourceMappingURL=waybill.js.map