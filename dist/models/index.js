"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = exports.Vehicle = exports.DisburseProduct = exports.Inventory = exports.Supplier = exports.Product = exports.TransferCyl = exports.RegisteredCylinder = exports.Cylinder = exports.User = exports.Person = exports.conn = void 0;
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
exports.conn.once('open', () => console.log('db connection open'));
//# sourceMappingURL=index.js.map