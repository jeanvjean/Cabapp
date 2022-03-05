"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventorySchema = exports.productRecievedSchema = exports.productDirection = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var productDirection;
(function (productDirection) {
    productDirection["IN"] = "in-coming";
    productDirection["OUT"] = "out-going";
})(productDirection = exports.productDirection || (exports.productDirection = {}));
exports.productRecievedSchema = new mongoose_1.Schema({
    partNumber: { type: String },
    productName: { type: String },
    quantity: { type: Number },
    passed: { type: Number },
    rejected: { type: Number },
    unitCost: {
        value: Number,
        unit: String
    },
    totalCost: {
        value: Number,
        unit: String
    },
    comment: { type: String },
    totalAvailable: { type: Number },
    equipmentModel: { type: String },
    equipmentType: { type: String }
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
    inspectingOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    grnDocument: { type: String },
    direction: { type: String, enum: Object.values(productDirection) },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    grnNo: { type: String },
    grInit: { type: Number },
    requestDepartment: { type: String },
    approved: { type: Boolean, default: false }
}, {
    timestamps: true
});
exports.inventorySchema.plugin(mongoosePaginate);
exports.inventorySchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('inventory', exports.inventorySchema);
}
exports.default = factory;
//# sourceMappingURL=receivedProduct.js.map