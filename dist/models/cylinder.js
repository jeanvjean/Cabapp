"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cylinderSchema = exports.CylinderCondition = exports.cylinderTypes = void 0;
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
var cylinderTypes;
(function (cylinderTypes) {
    cylinderTypes["BUFFER"] = "buffer";
    cylinderTypes["ASSIGNED"] = "assigned";
})(cylinderTypes = exports.cylinderTypes || (exports.cylinderTypes = {}));
var CylinderCondition;
(function (CylinderCondition) {
    CylinderCondition["REPAIR"] = "repair";
    CylinderCondition["DAMAGED"] = "condemned";
    CylinderCondition["FAULTY"] = "faulty";
    CylinderCondition["GOOD"] = "good";
})(CylinderCondition = exports.CylinderCondition || (exports.CylinderCondition = {}));
exports.cylinderSchema = new mongoose_1.Schema({
    gasName: { type: String, required: true },
    colorCode: { type: String, required: true },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: [cylinderTypes.BUFFER, cylinderTypes.ASSIGNED],
        default: cylinderTypes.BUFFER
    },
    condition: { type: String, enum: Object.values(CylinderCondition) }
}, {
    timestamps: true
});
exports.cylinderSchema.plugin(mongoosePaginate);
exports.cylinderSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('cylinder', exports.cylinderSchema);
}
exports.default = factory;
//# sourceMappingURL=cylinder.js.map