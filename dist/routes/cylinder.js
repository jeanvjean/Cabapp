"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const cylinder_1 = require("../controllers/cylinder");
const authentication_1 = require("../middlewares/authentication");
const val = new cylinder_1.Validator();
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/create-cylinder', cylinder_1.Validator.validateCylinder(), val.validate(), auth.verify(), controllers_1.cylinderCtrl.createCylinder());
router.get('/fetch-cylinders', controllers_1.cylinderCtrl.fetchCylinders());
router.get('/get-cylinder/:id', controllers_1.cylinderCtrl.cylinderDetails());
router.post('/register-cylinder', cylinder_1.Validator.validateCylinderRegisteration(), val.validate(), auth.verify(), controllers_1.cylinderCtrl.registerCylinder());
router.get('/fetch-registered-cylinders', auth.verify(), controllers_1.cylinderCtrl.fetchRegisteredCylinders());
router.get('/registered-cylinder-details/:id', auth.verify(), controllers_1.cylinderCtrl.fetchRegisteredCylinder());
router.post('/transfer-cylinders', auth.verify(), cylinder_1.Validator.validateCylinderTransfer(), val.validate(), controllers_1.cylinderCtrl.transferCylinder());
router.post('/approve-transfer', auth.verify(), controllers_1.cylinderCtrl.approveTransfer());
router.get('/fetch-transfers', controllers_1.cylinderCtrl.fetchTransferRequests());
router.get('/fetch-transfer/:id', controllers_1.cylinderCtrl.fetchTransferDetails());
router.get('/pending-approval', auth.verify(), controllers_1.cylinderCtrl.usersPendingApprovals());
router.delete('/remove-cylinder/:cylinderId', auth.verify(), controllers_1.cylinderCtrl.deleteRegisteredCylinder());
router.get('/fetch-damaged-cylinders', controllers_1.cylinderCtrl.fetchDamagedCylinders());
exports.default = router;
//# sourceMappingURL=cylinder.js.map