"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverSchema = void 0;
const mongoose_1 = require("mongoose");
exports.driverSchema = new mongoose_1.Schema({
    name: { type: String },
    age: { type: String },
    email: { type: String, unique: true },
    qualification: { type: String },
    height: { type: String },
    address: { type: String },
    image: { type: String }
});
function factory(conn) {
    return conn.model('driver', exports.driverSchema);
}
exports.default = factory;
//# sourceMappingURL=driver.js.map