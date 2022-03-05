"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanStatus = void 0;
const mongoose_1 = require("mongoose");
const mongoosPaginate = require("mongoose-paginate-v2");
var scanStatus;
(function (scanStatus) {
    scanStatus["ON_GOING"] = "in-progress";
    scanStatus["COMPLETE"] = "completed";
})(scanStatus = exports.scanStatus || (exports.scanStatus = {}));
const scanCylinderSchema = new mongoose_1.Schema({
    cylinderNumber: String,
    assignedNumber: String,
    barcode: String
});
const scanSchema = new mongoose_1.Schema({
    formId: String,
    cylinders: [scanCylinderSchema],
    initNum: Number,
    status: { type: String, enum: Object.values(scanStatus), default: scanStatus.ON_GOING }
});
scanSchema.plugin(mongoosPaginate);
function factory(conn) {
    return conn.model('scan', scanSchema);
}
exports.default = factory;
//# sourceMappingURL=scan.js.map