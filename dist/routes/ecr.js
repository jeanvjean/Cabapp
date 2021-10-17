"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const authentication_1 = require("../middlewares/authentication");
const ecr_1 = require("../controllers/ecr");
const auth = new authentication_1.default();
const val = new ecr_1.Validator();
const router = express_1.Router();
router.post('/create-ecr', auth.verify(), ecr_1.Validator.createEcr(), val.validate(), controllers_1.ecrCtrl.createEcr());
router.get('/fetch-ecr', auth.verify(), controllers_1.ecrCtrl.fetchEcr());
router.post('/approve-ecr', auth.verify(), ecr_1.Validator.approveEcr(), val.validate(), controllers_1.ecrCtrl.approveEcr());
router.get('/ecr-details/:ecrId', auth.verify(), controllers_1.ecrCtrl.ecrDetails());
router.get('/fetch-ecr-approvals', auth.verify(), controllers_1.ecrCtrl.fetchPendingApprovals());
router.get('/fetch-tecr', auth.verify(), controllers_1.ecrCtrl.fetchEcrs());
router.get('/tecr-details/:ecrNo', auth.verify(), controllers_1.ecrCtrl.fetchTEcrDetails());
router.get('/submit-otp/:tecrId/:otp', auth.verify(), controllers_1.ecrCtrl.completeTecr());
exports.default = router;
//# sourceMappingURL=ecr.js.map