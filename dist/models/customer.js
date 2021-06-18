"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSchema = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
exports.customerSchema = new mongoose_1.Schema({
    name: String,
    customerType: String,
    modeOfeService: String,
    nickName: String,
    address: String,
    contactPerson: String,
    email: String,
    TIN: String,
    phoneNumber: Number,
    rcNumber: String,
    cylinderHoldingTime: Date,
    territory: String,
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'products' }],
    unitPrice: Number,
    CAC: String,
    validID: String,
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' }
}, {
    timestamps: true
});
exports.customerSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('customer', exports.customerSchema);
}
exports.default = factory;
//# sourceMappingURL=customer.js.map