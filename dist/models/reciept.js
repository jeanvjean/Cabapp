"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMode = exports.CustomerType = exports.receiptType = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const receivedProduct_1 = require("./receivedProduct");
const sales_requisition_1 = require("./sales-requisition");
var receiptType;
(function (receiptType) {
    receiptType["PRODUCT"] = "product";
    receiptType["CYLINDER"] = "cylinder";
})(receiptType = exports.receiptType || (exports.receiptType = {}));
var CustomerType;
(function (CustomerType) {
    CustomerType["WALKIN"] = "walk-in";
    CustomerType["REGISTERED"] = "registered";
})(CustomerType = exports.CustomerType || (exports.CustomerType = {}));
var paymentMode;
(function (paymentMode) {
    paymentMode["CASH"] = "cash";
    paymentMode["BANK_TRANSFER"] = "bank transfer";
    paymentMode["DEBIT_CARD"] = "debit card";
})(paymentMode = exports.paymentMode || (exports.paymentMode = {}));
const recieptSchema = new mongoose_1.Schema({
    customer: { type: String },
    cylinderType: { type: String },
    recieptType: { type: String, enum: Object.values(receiptType) },
    customerType: { type: String, enum: Object.values(CustomerType) },
    cylinders: { type: [sales_requisition_1.saleCylinderSchema] },
    products: { type: [receivedProduct_1.productRecievedSchema] },
    invoiceNo: { type: Number },
    totalAmount: { type: Number },
    amountPaid: { type: Number },
    outstandingBalance: { type: Number },
    paymentMode: { type: String, enum: Object.values(paymentMode) },
    date: { type: Date },
    preparedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    amountInWords: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
recieptSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('reciept', recieptSchema);
}
exports.default = factory;
//# sourceMappingURL=reciept.js.map