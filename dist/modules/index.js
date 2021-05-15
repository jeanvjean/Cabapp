"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.account = exports.ocn = exports.purchase = exports.production = exports.sales = exports.customer = exports.driver = exports.vehicle = exports.product = exports.cylinder = exports.user = exports.person = void 0;
const index_1 = require("../models/index");
const person_1 = require("./person");
const user_1 = require("./user");
const cylinder_1 = require("./cylinder");
const inventory_1 = require("./inventory");
const vehicle_1 = require("./vehicle");
const driver_1 = require("./driver");
const customers_1 = require("./customers");
const sales_1 = require("./sales");
const production_1 = require("./production");
const purchaseOrder_1 = require("./purchaseOrder");
const ocn_1 = require("./ocn");
const account_1 = require("./account");
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
    transfer: index_1.TransferCyl,
    archive: index_1.Archive,
    user: index_1.User
});
exports.product = new inventory_1.default({
    product: index_1.Product,
    supplier: index_1.Supplier,
    inventory: index_1.Inventory,
    disburse: index_1.DisburseProduct,
    branch: index_1.Branch,
    user: index_1.User
});
exports.vehicle = new vehicle_1.default({
    vehicle: index_1.Vehicle,
    pickup: index_1.PickupRoutes
});
exports.driver = new driver_1.default({
    driver: index_1.User
});
exports.customer = new customers_1.default({
    customer: index_1.Customer,
    order: index_1.Order,
    complaint: index_1.Complain,
    user: index_1.User,
    walkin: index_1.WalkInCustomer
});
exports.sales = new sales_1.default({
    sales: index_1.SalesReq,
    user: index_1.User,
    cylinder: index_1.RegisteredCylinder,
    purchase: index_1.PurchaseOrder
});
exports.production = new production_1.default({
    production: index_1.Production,
    user: index_1.User
});
exports.purchase = new purchaseOrder_1.default({
    purchase: index_1.PurchaseOrder,
    user: index_1.User
});
exports.ocn = new ocn_1.default({
    ocn: index_1.OCN,
    user: index_1.User
});
exports.account = new account_1.default({
    account: index_1.Reciept
});
//# sourceMappingURL=index.js.map