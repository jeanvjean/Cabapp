"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSchema = exports.ModeOfService = exports.CustomerSubType = exports.CustomerType = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var CustomerType;
(function (CustomerType) {
    CustomerType["WALKIN"] = "walk-in";
    CustomerType["REGULAR"] = "regular";
})(CustomerType = exports.CustomerType || (exports.CustomerType = {}));
var CustomerSubType;
(function (CustomerSubType) {
    CustomerSubType["ASNL_COOPRATE"] = "asnl-cooprate";
    CustomerSubType["ASNL_MEDICAL"] = "asnl-medical";
    CustomerSubType["ASNL_RETAIL"] = "asnl-retail";
    CustomerSubType["TP_COOPRATE"] = "tp-cooprate";
    CustomerSubType["TP_MEDICAL"] = "tp-medical";
    CustomerSubType["TP_RETAIL"] = "tp-retail";
})(CustomerSubType = exports.CustomerSubType || (exports.CustomerSubType = {}));
var ModeOfService;
(function (ModeOfService) {
    ModeOfService["ASNL_CYLINDER"] = "asnl-cylinder";
    ModeOfService["CUSTOMER_CYLINDER"] = "customer-cylinder";
    ModeOfService["BOTH"] = "both";
})(ModeOfService = exports.ModeOfService || (exports.ModeOfService = {}));
const customerProductSchema = new mongoose_1.Schema({
    product: {
        product_id: mongoose_1.Schema.Types.ObjectId,
        productName: String,
        colorCode: String
    },
    unit_price: {
        value: Number,
        unit: String
    },
    vat: {
        value: Number,
        unit: String
    }
});
exports.customerSchema = new mongoose_1.Schema({
    name: { type: String, lowercase: true },
    customerType: { type: String, enum: Object.values(CustomerType), default: CustomerType.REGULAR, lowercase: true },
    customerSubType: { type: String, enum: Object.values(CustomerSubType), lowercase: true },
    modeOfeService: { type: String, enum: Object.values(ModeOfService), default: ModeOfService.BOTH },
    nickName: { type: String, lowercase: true },
    address: String,
    contactPerson: { type: String, lowercase: true },
    email: { type: String, lowercase: true },
    TIN: String,
    phoneNumber: Number,
    rcNumber: String,
    cylinderHoldingTime: Date,
    territory: String,
    products: [customerProductSchema],
    CAC: String,
    validID: String,
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    unique_id: { type: String, required: true, unique: true },
    gen_id_no: Number,
    vat: {
        value: Number,
        unit: String
    }
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