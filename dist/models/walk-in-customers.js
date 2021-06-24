"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalkinCustomerStatus = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var WalkinCustomerStatus;
(function (WalkinCustomerStatus) {
    WalkinCustomerStatus["FILLED"] = "filled";
    WalkinCustomerStatus["EMPTY"] = "empty";
})(WalkinCustomerStatus = exports.WalkinCustomerStatus || (exports.WalkinCustomerStatus = {}));
const walkinCustomerCylinderSchema = new mongoose_1.Schema({
    cylinderNo: String,
    cylinderSize: String,
    totalVolume: String,
});
const walkInCustomerSchema = new mongoose_1.Schema({
    customerName: String,
    ercNo: String,
    orderType: String,
    cylinders: [walkinCustomerCylinderSchema],
    date: Date,
    icnNo: String,
    totalQuantity: String,
    modeOfService: String,
    serialNo: Number,
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    status: { type: String, enum: Object.values(WalkinCustomerStatus), default: WalkinCustomerStatus.EMPTY }
}, {
    timestamps: true
});
walkInCustomerSchema.plugin(mongoosePaginate);
function factory(conn) {
    return conn.model('walk-in-customer', walkInCustomerSchema);
}
exports.default = factory;
//# sourceMappingURL=walk-in-customers.js.map