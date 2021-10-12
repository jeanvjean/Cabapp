"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/register-vehicle', auth.verify(), controllers_1.vehicleCtrl.createVehicle());
router.post('/update-vehicle/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.updateVehicle());
router.get('/fetch-vehicles', auth.verify(), controllers_1.vehicleCtrl.fetchVehicles());
router.get('/fetch-vehicle/:id', controllers_1.vehicleCtrl.fetchVehicle());
router.post('/register-inspection/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.vehicleInspection());
router.get('/view-inspection-history/:vehicleId', controllers_1.vehicleCtrl.fetchInspectionHistory());
router.post('/approve-inspection/:vehicleId/:inspectionId', auth.verify(), controllers_1.vehicleCtrl.approveInspection());
router.get('/approve-inspection/:vehicleId/:inspectionId', auth.verify(), controllers_1.vehicleCtrl.viewInspectionDetails());
router.post('/record-route/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.recordRoute());
router.post('/start-route/:routeId', auth.verify(), controllers_1.vehicleCtrl.startRoute());
router.get('/vehicle-performance/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.fetchVehiclePerformance());
router.get('/fetch-route-plan/:routeId', auth.verify(), controllers_1.vehicleCtrl.fetchRoutePlan());
router.post('/assign-driver/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.assignDriver());
router.get('/fetch-routePlans', auth.verify(), controllers_1.vehicleCtrl.RoutePlans());
router.delete('/delete-vehicle/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.deleteVehicle());
router.get('/remove-driver/:vehicleId/:driver', auth.verify(), controllers_1.vehicleCtrl.removeDriver());
router.post('/mark-route-as-complete/:routeId', auth.verify(), controllers_1.vehicleCtrl.markRouteAsComplete());
router.get('/fetch-activityLogs/:userId', auth.verify(), controllers_1.vehicleCtrl.fetchActivityLogs());
router.get('/fetch-all-vehicle', auth.verify(), controllers_1.vehicleCtrl.fetchallVehicles());
router.get('/vehicle-routePlan/:vehicleId', auth.verify(), controllers_1.vehicleCtrl.vehicleRoutePlan());
router.post('/create-delivery-note', auth.verify(), controllers_1.vehicleCtrl.genWaybill());
router.get('/fetch-delivery-notes', auth.verify(), controllers_1.vehicleCtrl.fetchWaybills);
router.get('/delivery-note/:id', auth.verify(), controllers_1.vehicleCtrl.fetchDeliveryDetails());
exports.default = router;
//# sourceMappingURL=vehicle.js.map