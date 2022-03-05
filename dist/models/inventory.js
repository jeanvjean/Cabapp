"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = void 0;
/* eslint-disable require-jsdoc */
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
exports.productSchema = new mongoose_1.Schema({
    productName: { type: String, lowercase: true },
    itemDescription: { type: String, lowercase: true },
    equipmentModel: { type: String, lowercase: true },
    equipmentType: { type: String, lowercase: true },
    areaOfSpecialization: { type: String, lowercase: true },
    asnlNumber: { type: String, lowercase: true },
    partNumber: { type: String, lowercase: true },
    serialNumber: { type: Number },
    quantity: { type: Number },
    unitCost: {
        value: Number,
        unit: String
    },
    totalCost: {
        value: Number,
        unit: String
    },
    reorderLevel: { type: Number },
    location: { type: String, lowercase: true },
    referer: { type: String, lowercase: true },
    division: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    deleted: { type: Boolean, default: false },
    inStock: { type: Boolean },
    outOfStock: { type: Boolean }
}, {
    collection: 'products',
    timestamps: true
});
exports.productSchema.plugin(mongoosePaginate);
exports.productSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('products', exports.productSchema);
}
exports.default = factory;
//# sourceMappingURL=inventory.js.map