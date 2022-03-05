"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const teretorySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('terretory', teretorySchema);
}
exports.default = factory;
//# sourceMappingURL=territory.js.map