"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const deletedUserSchema = new mongoose_1.Schema({
    name: { type: String },
    email: { type: String },
    role: { type: String },
    department: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: "branches" },
    reason: { type: String }
}, {
    timestamps: true
});
deletedUserSchema.plugin(mongoosePaginate);
deletedUserSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('deleted_users', deletedUserSchema);
}
exports.default = factory;
//# sourceMappingURL=removedUser.js.map