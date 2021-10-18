"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const purchaseOrder_1 = require("../controllers/purchaseOrder");
const auth = new authentication_1.default();
const val = new purchaseOrder_1.Validator();
const router = express_1.Router();
router.post('/create-purchase-order', auth.verify(), purchaseOrder_1.Validator.validatePurchase(), val.validate(), controllers_1.purchaseCtrl.createPurchserOrder());
router.get('/fetch-purchase-orders', auth.verify(), controllers_1.purchaseCtrl.fetchPurchases());
router.post('/approve-purchase-order/:purchaseId', auth.verify(), purchaseOrder_1.Validator.approvePurchaseOrder(), val.validate(), controllers_1.purchaseCtrl.approvePurchaseOrder());
router.get('/fetch-purchase-approvals', auth.verify(), controllers_1.purchaseCtrl.fetchPurchaseApprovals());
router.get('/fetch-order/:orderId', auth.verify(), controllers_1.purchaseCtrl.viewOrderDetails());
exports.default = router;
//# sourceMappingURL=purchase.js.map