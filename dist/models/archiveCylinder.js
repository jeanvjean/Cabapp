"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveCylinderSchema = void 0;
/* eslint-disable require-jsdoc */
const mongoose_1 = require("mongoose");
const mongoosePagination = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
exports.archiveCylinderSchema = new mongoose_1.Schema({
    cylinderType: { type: String },
    waterCapacity: {
        value: Number,
        unit: String
    },
    dateManufactured: { type: Date },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'customer' },
    gasType: { type: String },
    standardColor: { type: String },
    assignedNumber: { type: String },
    testingPresure: { type: String },
    fillingPreasure: { type: String },
    gasVolumeContent: {
        value: Number,
        unit: String
    },
    cylinderNumber: { type: String },
    condition: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    holdingTime: { type: Date },
    department: { type: String },
    purchaseCost: {
        cost: Number,
        unit: String
    },
});
exports.archiveCylinderSchema.plugin(mongoosePagination);
exports.archiveCylinderSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('archive-cylinders', exports.archiveCylinderSchema);
}
exports.default = factory;
//# sourceMappingURL=archiveCylinder.js.map