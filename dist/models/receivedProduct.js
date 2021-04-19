"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventorySchema = exports.productRecievedSchema = void 0;
const mongoose_1 = require("mongoose");
exports.productRecievedSchema = new mongoose_1.Schema({
    productNumber: { type: String },
    productName: { type: String },
    quantity: { type: Number },
    passed: { type: Number },
    rejected: { type: Number },
    unitCost: { type: Number },
    totalCost: { type: Number },
    comment: { type: String }
}, {
    timestamps: true
});
exports.inventorySchema = new mongoose_1.Schema({
    supplier: { type: String },
    LPOnumber: { type: String },
    wayBillNumber: { type: String },
    invoiceNumber: { type: String },
    dateReceived: { type: Date },
    products: [exports.productRecievedSchema],
    inspectingOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    grnDocument: { type: String }
});
function factory(conn) {
    return conn.model('inventory', exports.inventorySchema);
}
exports.default = factory;
//# sourceMappingURL=receivedProduct.js.map