"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scan = exports.emptyCylinder = exports.account = exports.ocn = exports.purchase = exports.production = exports.sales = exports.customer = exports.driver = exports.vehicle = exports.product = exports.cylinder = exports.user = exports.person = void 0;
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
const ecr_1 = require("./ecr");
const scan_1 = require("./scan");
/**
 * @category Modules
 * @param {person} Instance of Person module
 */
exports.person = new person_1.default({
    model: index_1.Person
});
exports.user = new user_1.default({
    user: index_1.User,
    deleted: index_1.DeletedUsers
});
exports.cylinder = new cylinder_1.default({
    cylinder: index_1.Cylinder,
    registerCylinder: index_1.RegisteredCylinder,
    transfer: index_1.TransferCyl,
    archive: index_1.Archive,
    user: index_1.User,
    condemn: index_1.Condemn,
    change_gas: index_1.ChangeCylinder,
    customer: index_1.Customer,
    branch: index_1.Branch,
    supplier: index_1.Supplier,
    ocn: index_1.OCN,
    waybill: index_1.Waybill
});
exports.product = new inventory_1.default({
    product: index_1.Product,
    supplier: index_1.Supplier,
    inventory: index_1.Inventory,
    disburse: index_1.DisburseProduct,
    branch: index_1.Branch,
    user: index_1.User,
    customer: index_1.Customer
});
exports.vehicle = new vehicle_1.default({
    vehicle: index_1.Vehicle,
    pickup: index_1.PickupModel,
    user: index_1.User,
    activity: index_1.Activity,
    registerCylinder: index_1.RegisteredCylinder,
    branch: index_1.Branch,
    routeReport: index_1.VehicleReport,
    customer: index_1.Customer,
    supplier: index_1.Supplier,
    ecr: index_1.EmptyCylinder,
    waybill: index_1.Waybill,
    ocn: index_1.OCN,
    invoice: index_1.Reciept,
    terretory: index_1.TerretoryModel
});
exports.driver = new driver_1.default({
    driver: index_1.User
});
exports.customer = new customers_1.default({
    customer: index_1.Customer,
    order: index_1.Order,
    complaint: index_1.Complain,
    user: index_1.User,
    walkin: index_1.WalkInCustomer,
    branch: index_1.Branch,
    product: index_1.Product,
    vehicle: index_1.Vehicle,
    supplier: index_1.Supplier,
    cylinder: index_1.Cylinder,
    deleteCustomer: index_1.DeletedCustomers,
    pickup: index_1.PickupModel
});
exports.sales = new sales_1.default({
    sales: index_1.SalesReq,
    user: index_1.User,
    cylinder: index_1.RegisteredCylinder,
    purchase: index_1.PurchaseOrder,
    ecr: index_1.EmptyCylinder,
    productionSchedule: index_1.Production
});
exports.production = new production_1.default({
    production: index_1.Production,
    user: index_1.User,
    regCylinder: index_1.RegisteredCylinder,
    ecr: index_1.EmptyCylinder
});
exports.purchase = new purchaseOrder_1.default({
    purchase: index_1.PurchaseOrder,
    user: index_1.User,
    ecr: index_1.EmptyCylinder,
    cylinder: index_1.RegisteredCylinder
});
exports.ocn = new ocn_1.default({
    ocn: index_1.OCN,
    user: index_1.User,
    customer: index_1.Customer,
    branch: index_1.Branch,
    cylinder: index_1.RegisteredCylinder,
    delivery: index_1.Waybill
});
exports.account = new account_1.default({
    account: index_1.Reciept,
    salesRequisition: index_1.SalesReq,
    deliveryNote: index_1.Waybill
});
exports.emptyCylinder = new ecr_1.default({
    emptyCylinder: index_1.EmptyCylinder,
    user: index_1.User,
    cylinder: index_1.RegisteredCylinder,
    customer: index_1.Customer,
    ocn: index_1.OCN,
    branch: index_1.Branch
});
exports.scan = new scan_1.default({
    scan: index_1.ScanModel,
    cylinder: index_1.RegisteredCylinder
});
//# sourceMappingURL=index.js.map