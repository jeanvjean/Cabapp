"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierSchema = void 0;
const mongoose_1 = require("mongoose");
exports.supplierSchema = new mongoose_1.Schema({
    productType: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'products' }],
    name: { type: String },
    location: { type: String },
    contactPerson: { type: String },
    emailAddress: { type: String },
    phoneNumber: { type: Number },
    supplierType: { type: String }
});
function factory(conn) {
    return conn.model('supplier', exports.supplierSchema);
}
exports.default = factory;
//# sourceMappingURL=supplier.js.map