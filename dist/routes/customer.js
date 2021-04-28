"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const customer_1 = require("../controllers/customer");
const auth = new authentication_1.default();
const val = new customer_1.Validator();
const router = express_1.Router();
router.post('/create-customer', auth.verify(), customer_1.Validator.validateCustomer(), val.validate(), controllers_1.customerCtrl.createCustomer());
router.get('/fetch-customers', controllers_1.customerCtrl.fetchCustomers());
router.get('/fetch-customer/:customerId', controllers_1.customerCtrl.fetchCustomer());
router.post('/create-order/:customerId', auth.verify(), controllers_1.customerCtrl.createOrder());
router.get('/fetch-order/:customerId', controllers_1.customerCtrl.fetchUserOrder());
exports.default = router;
//# sourceMappingURL=customer.js.map