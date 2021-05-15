"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMode = void 0;
const mongoose_1 = require("mongoose");
var paymentMode;
(function (paymentMode) {
    paymentMode["CASH"] = "cash";
    paymentMode["BANK_TRANSFER"] = "bank transfer";
    paymentMode["DEBIT_CARD"] = "debit card";
})(paymentMode = exports.paymentMode || (exports.paymentMode = {}));
const recieptSchema = new mongoose_1.Schema({
    customer: { type: String },
    cylinderType: { type: String },
    invoiceNo: { type: Number },
    totalAmount: { type: Number },
    amountPaid: { type: Number },
    outstandingBalance: { type: Number },
    paymentMode: { type: String, enum: Object.values(paymentMode) },
    date: { type: Date },
    preparedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    amountInWords: { type: String }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('reciept', recieptSchema);
}
exports.default = factory;
//# sourceMappingURL=reciept.js.map