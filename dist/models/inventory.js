"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
exports.productSchema = new mongoose_1.Schema({
    productName: { type: String },
    itemDescription: { type: String },
    equipmentModel: { type: String },
    equipmentType: { type: String },
    areaOfSpecialization: { type: String },
    asnlNumber: { type: String },
    partNumber: { type: String },
    serialNumber: { type: Number },
    quantity: { type: Number },
    unitCost: { type: Number },
    totalCost: { type: Number },
    reorderLevel: { type: Number },
    location: { type: String },
    referer: { type: String },
    division: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    supplier: { type: mongoose_1.Schema.Types.ObjectId, ref: 'supplier' },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    deleted: { type: Boolean, default: false }
}, {
    collection: 'products',
    timestamps: true
});
exports.productSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('products', exports.productSchema);
}
exports.default = factory;
//# sourceMappingURL=inventory.js.map