"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const activitiesSchema = new mongoose_1.Schema({
    title: String,
    activity: String,
    time: Date
}, {
    timestamps: true
});
const activityLogsSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId },
    activities: { type: [activitiesSchema] }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('activity-logs', activityLogsSchema);
}
exports.default = factory;
//# sourceMappingURL=logs.js.map