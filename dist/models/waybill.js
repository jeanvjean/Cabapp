"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const order_1 = require("./order");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const waybillSchema = new mongoose_1.Schema({
    customer: {
        name: String,
        id: mongoose_1.Schema.Types.ObjectId,
        email: String
    },
    ocn_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "out-going-cylinders" },
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'registered-cylinders' }],
    invoiceNo: { type: String },
    lpoNo: { type: String },
    deliveryType: { type: String, enum: Object.values(order_1.pickupType) },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    numInit: Number,
    deliveryNo: String,
    route_plan_id: mongoose_1.Schema.Types.ObjectId,
    invoice_id: mongoose_1.Schema.Types.ObjectId
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