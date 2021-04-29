"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintSchema = void 0;
const mongoose_1 = require("mongoose");
exports.complaintSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    title: { type: String },
    issue: { type: String },
    comment: { type: String }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('complaint', exports.complaintSchema);
}
exports.default = factory;
//# sourceMappingURL=complaint.js.map