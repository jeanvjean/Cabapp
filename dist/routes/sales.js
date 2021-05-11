"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const sales_1 = require("../controllers/sales");
const authentication_1 = require("../middlewares/authentication");
const val = new sales_1.Validator();
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/create-sales-requisition', sales_1.Validator.validateSales(), val.validate(), auth.verify(), controllers_1.salesCtrl.createSalesReq());
router.get('/fetch-sales-requisitions', controllers_1.salesCtrl.fetchSalesReq());
router.get('/fetch-sales-req/:salesId', controllers_1.salesCtrl.fetchRequisitionDetails());
router.post('/approve-sales-requisition', auth.verify(), sales_1.Validator.validateSales(), val.validate(), controllers_1.salesCtrl.approveSalesRequisition());
router.get('/fetch-pending-req-approval', auth.verify(), controllers_1.salesCtrl.approveSalesRequisition());
exports.default = router;
//# sourceMappingURL=sales.js.map