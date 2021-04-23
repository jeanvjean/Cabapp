"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCylinderSchema = void 0;
const mongoose_1 = require("mongoose");
const cylinder_1 = require("./cylinder");
exports.registerCylinderSchema = new mongoose_1.Schema({
    cylinderType: { type: mongoose_1.Schema.Types.ObjectId },
    waterCapacity: { type: String },
    dateManufactured: { type: Date },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId },
    gasType: { type: mongoose_1.Schema.Types.ObjectId },
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