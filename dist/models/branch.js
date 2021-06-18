"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const branchSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    officers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'products' }],
    branchAdmin: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    location: { type: String }
}, {
    timestamps: true
});
branchSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('branches', branchSchema);
}
exports.default = factory;
//# sourceMappingURL=branch.js.map