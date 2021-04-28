"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ctrl = exports.customerCtrl = exports.driverCtrl = exports.vehicleCtrl = exports.productCtrl = exports.cylinderCtrl = exports.userCtrl = exports.personCtrl = void 0;
const modules_1 = require("../modules");
const cylinder_1 = require("./cylinder");
const ctrl_1 = require("./ctrl");
const person_1 = require("./person");
const user_1 = require("./user");
const inventory_1 = require("./inventory");
const vehicle_1 = require("./vehicle");
const driver_1 = require("./driver");
const customer_1 = require("./customer");
exports.personCtrl = new person_1.default(modules_1.person);
exports.userCtrl = new user_1.default(modules_1.user);
exports.cylinderCtrl = new cylinder_1.default(modules_1.cylinder);
exports.productCtrl = new inventory_1.default(modules_1.product);
exports.vehicleCtrl = new vehicle_1.default(modules_1.vehicle);
exports.driverCtrl = new driver_1.default(modules_1.driver);
exports.customerCtrl = new customer_1.default(modules_1.customer);
exports.ctrl = new ctrl_1.default();
//# sourceMappingURL=index.js.map