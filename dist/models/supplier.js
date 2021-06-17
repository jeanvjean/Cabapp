"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierSchema = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
exports.supplierSchema = new mongoose_1.Schema({
    name: { type: String },
    location: { type: String },
    contactPerson: { type: String },
    emailAddress: { type: String },
    phoneNumber: { type: Number },
    supplierType: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
});
exports.supplierSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('supplier', exports.supplierSchema);
}
exports.default = factory;
//# sourceMappingURL=supplier.js.map