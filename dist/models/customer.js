"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSchema = exports.CustomerType = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var CustomerType;
(function (CustomerType) {
    CustomerType["WALKIN"] = "walk-in";
    CustomerType["REGULAR"] = "regular";
})(CustomerType = exports.CustomerType || (exports.CustomerType = {}));
exports.customerSchema = new mongoose_1.Schema({
    name: { type: String, lowercase: true },
    customerType: { type: String, enum: Object.values(CustomerType), default: CustomerType.REGULAR, lowercase: true },
    modeOfeService: String,
    nickName: { type: String, lowercase: true },
    address: String,
    contactPerson: { type: String, lowercase: true },
    email: { type: String, lowercase: true },
    TIN: String,
    phoneNumber: Number,
    rcNumber: String,
    cylinderHoldingTime: Date,
    territory: String,
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'products' }],
    unitPrice: Number,
    CAC: String,
    validID: String,
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
exports.customerSchema.plugin(mongoosePaginate);
exports.customerSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('customer', exports.customerSchema);
}
exports.default = factory;
//# sourceMappingURL=customer.js.map