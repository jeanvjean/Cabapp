"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const performanceSchema = new mongoose_1.Schema({
    vehicle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'vehicle' },
    dateCompleted: { type: Date },
    dateStarted: { type: Date },
    departure: { type: String },
    client: String,
    destination: { type: String },
    driver: String,
    routeInfo: { type: mongoose_1.Schema.Types.ObjectId, ref: "pickup-routes" },
    mileageIn: String,
    mileageOut: String,
    timeOut: Date,
    timeIn: Date
}, {
    timestamps: true
});
performanceSchema.plugin(mongoosePaginate);
performanceSchema.plugin(aggregatePaginate);
function factory(conn) {
    return conn.model('performance', performanceSchema);
}
exports.default = factory;
//# sourceMappingURL=pickupReport.js.map