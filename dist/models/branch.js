"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const branchSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    officers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'users' }],
    products: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'products' }],
    branchAdmin: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    location: { type: String }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('branches', branchSchema);
}
exports.default = factory;
//# sourceMappingURL=branch.js.map