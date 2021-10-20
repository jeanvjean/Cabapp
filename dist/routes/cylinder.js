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
router.post('/approve-transfer', auth.verify(), cylinder_1.Validator.validateApproval(), val.validate(), controllers_1.cylinderCtrl.approveTransfer());
router.get('/fetch-transfers', auth.verify(), controllers_1.cylinderCtrl.fetchTransferRequests());
router.get('/fetch-transfer/:id', controllers_1.cylinderCtrl.fetchTransferDetails());
router.get('/pending-approval', auth.verify(), controllers_1.cylinderCtrl.usersPendingApprovals());
router.delete('/remove-cylinder/:cylinderId', auth.verify(), controllers_1.cylinderCtrl.deleteRegisteredCylinder());
router.get('/fetch-faulty-cylinders', auth.verify(), controllers_1.cylinderCtrl.fetchFaultyCylinders());
router.get('/fetch-customer-cylinders/:customerId', controllers_1.cylinderCtrl.fetchCustomerCylinders());
router.post('/update-reg-cylinder/:cylinderId', auth.verify(), cylinder_1.Validator.updateCylinder(), val.validate(), controllers_1.cylinderCtrl.updateRegCylinder());
router.get('/fetch-cylinder-transfer-report', auth.verify(), controllers_1.cylinderCtrl.fetchCompletedTransfers());
router.get('/mark-faulty-cylinder/:cylinderId', auth.verify(), controllers_1.cylinderCtrl.faultyCylinder());
router.post('/condemn-cylinders', auth.verify(), cylinder_1.Validator.validateCylinderCondemnation(), val.validate(), controllers_1.cylinderCtrl.condemnCylinder());
router.get('/fetch-archived-cylinders', auth.verify(), controllers_1.cylinderCtrl.fetchCondemnCylinders());
router.get('/fixed-cylinder/:cylinderId', auth.verify(), controllers_1.cylinderCtrl.fixFaultyCylinder());
router.get('/fetch-cylinder-stats', auth.verify(), controllers_1.cylinderCtrl.cylinderStats());
router.get('/returned-cylinder/:cylinderId', auth.verify(), controllers_1.cylinderCtrl.cylinderReturned());
router.get('/cylinder-transfer-stats', auth.verify(), controllers_1.cylinderCtrl.transferCylinderStats());
router.post('/returning-cylinders', auth.verify(), controllers_1.cylinderCtrl.returnCylinder());
router.get('/fetch-reg-cylinders', auth.verify(), controllers_1.cylinderCtrl.fetchRegistredCylindersWP());
router.get('/fetch-change_cylinder-requests', auth.verify(), controllers_1.cylinderCtrl.fetchChangeGasRequests());
router.get('/fetch-condemn-requests', auth.verify(), controllers_1.cylinderCtrl.fetchCondemnRequests());
router.get('/fetch-pending-condemnations', auth.verify(), controllers_1.cylinderCtrl.fetchPendingCondemnations());
router.get('/fetch-condemn-details/:condemnId', auth.verify(), controllers_1.cylinderCtrl.fetchCondemnInfo());
router.post('/approve-condemn-cylinder', auth.verify(), cylinder_1.Validator.validateApproval(), val.validate(), controllers_1.cylinderCtrl.approveCondemnCylinder());
router.post('/change-cylinder-type', auth.verify(), cylinder_1.Validator.validateGasChange(), val.validate(), controllers_1.cylinderCtrl.changeCylinderType());
router.get('/fetch-change-requests', auth.verify(), controllers_1.cylinderCtrl.fetchGasChangeRequests());
router.post('/approve-change-request', auth.verify(), cylinder_1.Validator.validateApproval(), val.validate(), controllers_1.cylinderCtrl.approveChangeCylinder());
router.get('/fetch-pending-cylinder_change', auth.verify(), controllers_1.cylinderCtrl.fetchPendingChangeCylinder());
router.get('/view-cylinder_change/:cylinderId', auth.verify(), controllers_1.cylinderCtrl.changeCylinderDetails());
router.get('/check-cylinder', auth.verify(), controllers_1.cylinderCtrl.fetchCylinderWithScan());
exports.default = router;
//# sourceMappingURL=cylinder.js.map