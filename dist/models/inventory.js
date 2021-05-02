"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = void 0;
const mongoose_1 = require("mongoose");
exports.productSchema = new mongoose_1.Schema({
    productName: { type: String },
    itemDescription: { type: String },
    equipmentModel: { type: String },
    equipmentType: { type: String },
    areaOfSpecialization: { type: String },
    asnlNumber: { type: String, unique: true },
    partNumber: { type: String },
    serialNumber: { type: Number, unique: true },
    quantity: { type: Number },
    unitCost: { type: Number },
    totalCost: { type: Number },
    reorderLevel: { type: Number },
    location: { type: String },
    referer: { type: String },
    division: { type: String },
    supplier: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branch' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('products', exports.productSchema);
}
exports.default = factory;
//# sourceMappingURL=inventory.js.map