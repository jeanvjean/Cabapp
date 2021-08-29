"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const authentication_1 = require("../middlewares/authentication");
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/create-ecr', auth.verify(), controllers_1.ecrCtrl.createEcr());
router.get('/fetch-ecr', auth.verify(), controllers_1.ecrCtrl.fetchEcr());
router.post('/approve-ecr', auth.verify(), controllers_1.ecrCtrl.approveEcr());
router.get('/ecr-details/:ecrId', auth.verify(), controllers_1.ecrCtrl.ecrDetails());
router.get('/fetch-ecr-approvals', auth.verify(), controllers_1.ecrCtrl.fetchPendingApprovals());
exports.default = router;
//# sourceMappingURL=ecr.js.map