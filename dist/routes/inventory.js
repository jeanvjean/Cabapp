"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/create-product', auth.verify(), controllers_1.productCtrl.createProduct());
router.get('/fetch-products', controllers_1.productCtrl.fetchProducts());
router.get('/fetch-product/:id', controllers_1.productCtrl.fetchProduct());
router.post('/create-supplier', controllers_1.productCtrl.createSupplier());
router.post('/register-inventory', auth.verify(), controllers_1.productCtrl.addInventory());
router.post('/disburse-products', auth.verify(), controllers_1.productCtrl.disburseProducts());
router.post('/approve-disbursement', auth.verify(), controllers_1.productCtrl.approveDisbursement());
router.get('/fetch-pending-disburse', auth.verify(), controllers_1.productCtrl.fetchDisburseApprovals());
router.get('/fetch-disburse-requests', auth.verify(), controllers_1.productCtrl.fetchDisbursements());
router.get('/fetch-disbursement/:id', controllers_1.productCtrl.fetchDisbursement());
exports.default = router;
//# sourceMappingURL=inventory.js.map