"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCylinderSchema = exports.TypesOfCylinders = void 0;
const mongoose_1 = require("mongoose");
const cylinder_1 = require("./cylinder");
var TypesOfCylinders;
(function (TypesOfCylinders) {
    TypesOfCylinders["BUFFER"] = "buffer";
    TypesOfCylinders["ASSIGNED"] = "assigned";
})(TypesOfCylinders = exports.TypesOfCylinders || (exports.TypesOfCylinders = {}));
exports.registerCylinderSchema = new mongoose_1.Schema({
    cylinderType: { type: String, enum: Object.values(TypesOfCylinders), default: TypesOfCylinders.BUFFER },
    waterCapacity: { type: String },
    dateManufactured: { type: Date },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    gasType: { type: String },
    standardColor: { type: String },
    assignedNumber: { type: String },
    testingPresure: { type: String },
    fillingPreasure: { type: String },
    gasVolumeContent: { type: String },
    cylinderNumber: { type: String },
    condition: { type: String, enum: Object.values(cylinder_1.CylinderCondition) }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('registered-cylinders', exports.registerCylinderSchema);
}
exports.default = factory;
//# sourceMappingURL=registeredCylinders.js.map