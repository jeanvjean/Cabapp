"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const account_1 = require("../controllers/account");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const auth = new authentication_1.default();
const val = new account_1.Validator();
const router = express_1.Router();
router.post('/create-invoice', auth.verify(), account_1.Validator.validateInvoice(), val.validate(), controllers_1.accountCtrl.createInvoice());
router.get('/fetch-invoices', auth.verify(), controllers_1.accountCtrl.fetchInvoices());
router.get('/fetch-invoice/:invoiceId', auth.verify(), controllers_1.accountCtrl.fetchInvoiceDetails());
router.post('/update-payment/:invoiceId', auth.verify(), account_1.Validator.validateUpdate(), val.validate(), controllers_1.accountCtrl.updateInvoice());
exports.default = router;
//# sourceMappingURL=account.js.map