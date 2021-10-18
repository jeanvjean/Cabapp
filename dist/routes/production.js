"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const production_1 = require("../controllers/production");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const auth = new authentication_1.default;
const val = new production_1.Validator();
const router = express_1.Router();
router.post('/create-production-schedule', auth.verify(), production_1.Validator.validateProductionSchedule(), val.validate(), controllers_1.productionCtrl.createProductionSchedule());
router.post('/approve-production-schedule', auth.verify(), production_1.Validator.validateApproval(), val.validate(), controllers_1.productionCtrl.approveProductionSchedule());
router.get('/fetch-production-approvals', auth.verify(), controllers_1.productionCtrl.fetchPendingProductionApprovals());
router.get('/fetch-prodctionSchedule/:productionId', controllers_1.productionCtrl.viewProductionSchedule());
router.get('/fetch-production-schedules', auth.verify(), controllers_1.productionCtrl.fetchProductions());
router.post('/update-completed-cylinders', auth.verify(), production_1.Validator.markFullCylinders(), val.validate(), controllers_1.productionCtrl.markCompletedCylinders());
router.get('/mark-completed-production/:productionId', auth.verify(), controllers_1.productionCtrl.markCompletedProduction());
exports.default = router;
//# sourceMappingURL=production.js.map