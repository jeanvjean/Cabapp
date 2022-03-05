"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const deletedCustomerSchema = new mongoose_1.Schema({
    name: { type: String },
    email: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: "branches" },
    reason: { type: String },
    type: String
}, {
    timestamps: true
});
deletedCustomerSchema.plugin(mongoosePaginate);
deletedCustomerSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('deleted_customers', deletedCustomerSchema);
}
exports.default = factory;
//# sourceMappingURL=deletedCustomers.js.map