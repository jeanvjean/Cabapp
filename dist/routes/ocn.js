"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ocn_1 = require("../controllers/ocn");
const controllers_1 = require("../controllers");
const authentication_1 = require("../middlewares/authentication");
const auth = new authentication_1.default();
const val = new ocn_1.Validator();
const router = express_1.Router();
router.post('/create-ocn', auth.verify(), ocn_1.Validator.validateOcn(), val.validate(), controllers_1.ocnController.recordOcn());
router.post('/approve-ocn/:ocnId', auth.verify(), ocn_1.Validator.validateApproval(), val.validate(), controllers_1.ocnController.approveOcn());
router.get('/fetch-ocn-approvals', auth.verify(), controllers_1.ocnController.fetchOcnApprovals());
router.get('/fetch-ocn-details/:ocnId', auth.verify(), controllers_1.ocnController.fetchOcnDetails());
exports.default = router;
//# sourceMappingURL=ocn.js.map