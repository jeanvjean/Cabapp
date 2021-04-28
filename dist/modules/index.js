"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer = exports.driver = exports.vehicle = exports.product = exports.cylinder = exports.user = exports.person = void 0;
const index_1 = require("../models/index");
const person_1 = require("./person");
const user_1 = require("./user");
const cylinder_1 = require("./cylinder");
const inventory_1 = require("./inventory");
const vehicle_1 = require("./vehicle");
const driver_1 = require("./driver");
const customers_1 = require("./customers");
/**
 * @category Modules
 * @param {person} Instance of Person module
 */
exports.person = new person_1.default({
    model: index_1.Person
});
exports.user = new user_1.default({
    model: index_1.User
});
exports.cylinder = new cylinder_1.default({
    cylinder: index_1.Cylinder,
    registerCylinder: index_1.RegisteredCylinder,
    transfer: index_1.TransferCyl
});
exports.product = new inventory_1.default({
    product: index_1.Product,
    supplier: index_1.Supplier,
    inventory: index_1.Inventory,
    disburse: index_1.DisburseProduct
});
exports.vehicle = new vehicle_1.default({
    vehicle: index_1.Vehicle
});
exports.driver = new driver_1.default({
    driver: index_1.User
});
exports.customer = new customers_1.default({
    customer: index_1.Customer,
    order: index_1.Order
});
//# sourceMappingURL=index.js.map