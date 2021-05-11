"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveCylinderSchema = void 0;
const mongoose_1 = require("mongoose");
exports.archiveCylinderSchema = new mongoose_1.Schema({
    cylinderType: { type: String },
    waterCapacity: { type: String },
    dateManufactured: { type: Date },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    gasType: { type: String },
    standardColor: { type: String },
    assignedNumber: { type: String },
    testingPresure: { type: String },
    fillingPreasure: { type: String },
    gasVolumeContent: { type: String },
    cylinderNumber: { type: String },
    condition: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    holdingTime: { type: Date },
    department: { type: String }
});
function factory(conn) {
    return conn.model('archive-cylinders', exports.archiveCylinderSchema);
}
exports.default = factory;
//# sourceMappingURL=archiveCylinder.js.map