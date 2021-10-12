"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Waybill = exports.EmptyCylinder = exports.DeletedCustomers = exports.VehicleReport = exports.DeletedUsers = exports.ChangeCylinder = exports.Condemn = exports.Activity = exports.Reciept = exports.OCN = exports.PurchaseOrder = exports.Production = exports.SalesReq = exports.WalkInCustomer = exports.PickupModel = exports.Archive = exports.Branch = exports.Complain = exports.Order = exports.Customer = exports.Driver = exports.Vehicle = exports.DisburseProduct = exports.Inventory = exports.Supplier = exports.Product = exports.TransferCyl = exports.RegisteredCylinder = exports.Cylinder = exports.User = exports.Person = exports.conn = void 0;
const mongoose_1 = require("mongoose");
const mongo_1 = require("../configs/mongo");
const cylinder_1 = require("./cylinder");
const person_1 = require("./person");
const user_1 = require("./user");
const registeredCylinders_1 = require("./registeredCylinders");
const transferCylinder_1 = require("./transferCylinder");
const inventory_1 = require("./inventory");
const supplier_1 = require("./supplier");
const receivedProduct_1 = require("./receivedProduct");
const disburseStock_1 = require("./disburseStock");
const vehicle_1 = require("./vehicle");
const driver_1 = require("./driver");
const customer_1 = require("./customer");
const order_1 = require("./order");
const complaint_1 = require("./complaint");
const branch_1 = require("./branch");
const archiveCylinder_1 = require("./archiveCylinder");
const driverPickup_1 = require("./driverPickup");
const walk_in_customers_1 = require("./walk-in-customers");
const sales_requisition_1 = require("./sales-requisition");
const productionSchedule_1 = require("./productionSchedule");
const purchaseOrder_1 = require("./purchaseOrder");
const ocn_1 = require("./ocn");
const reciept_1 = require("./reciept");
const logs_1 = require("./logs");
const condemnCylinder_1 = require("./condemnCylinder");
const change_cylinder_1 = require("./change-cylinder");
const removedUser_1 = require("./removedUser");
const pickupReport_1 = require("./pickupReport");
const deletedCustomers_1 = require("./deletedCustomers");
const emptyCylinder_1 = require("./emptyCylinder");
const waybill_1 = require("./waybill");
exports.conn = mongoose_1.createConnection(mongo_1.default.uri, mongo_1.default.options);
exports.Person = person_1.default(exports.conn);
exports.User = user_1.default(exports.conn);
exports.Cylinder = cylinder_1.default(exports.conn);
exports.RegisteredCylinder = registeredCylinders_1.default(exports.conn);
exports.TransferCyl = transferCylinder_1.default(exports.conn);
exports.Product = inventory_1.default(exports.conn);
exports.Supplier = supplier_1.default(exports.conn);
exports.Inventory = receivedProduct_1.default(exports.conn);
exports.DisburseProduct = disburseStock_1.default(exports.conn);
exports.Vehicle = vehicle_1.default(exports.conn);
exports.Driver = driver_1.default(exports.conn);
exports.Customer = customer_1.default(exports.conn);
exports.Order = order_1.default(exports.conn);
exports.Complain = complaint_1.default(exports.conn);
exports.Branch = branch_1.default(exports.conn);
exports.Archive = archiveCylinder_1.default(exports.conn);
exports.PickupModel = driverPickup_1.default(exports.conn);
exports.WalkInCustomer = walk_in_customers_1.default(exports.conn);
exports.SalesReq = sales_requisition_1.default(exports.conn);
exports.Production = productionSchedule_1.default(exports.conn);
exports.PurchaseOrder = purchaseOrder_1.default(exports.conn);
exports.OCN = ocn_1.default(exports.conn);
exports.Reciept = reciept_1.default(exports.conn);
exports.Activity = logs_1.default(exports.conn);
exports.Condemn = condemnCylinder_1.default(exports.conn);
exports.ChangeCylinder = change_cylinder_1.default(exports.conn);
exports.DeletedUsers = removedUser_1.default(exports.conn);
exports.VehicleReport = pickupReport_1.default(exports.conn);
exports.DeletedCustomers = deletedCustomers_1.default(exports.conn);
exports.EmptyCylinder = emptyCylinder_1.default(exports.conn);
exports.Waybill = waybill_1.default(exports.conn);
exports.conn.once('open', () => console.log('db connection open'));
//# sourceMappingURL=index.js.map