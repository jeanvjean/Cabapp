import { Router as expressRouter } from 'express';
import Auth from '../middlewares/authentication';
import { vehicleCtrl } from '../controllers';
import { Validator } from '../controllers/vehicle';
const auth = new Auth();
const val = new Validator();

const router:expressRouter = expressRouter();

router.post(
  '/register-vehicle',
  auth.verify(),
  Validator.validateInput(),
  val.validate(),
  vehicleCtrl.createVehicle()
);

router.post(
  '/update-vehicle/:vehicleId',
  auth.verify(),
  Validator.validateVehicleUpdate(),
  val.validate(),
  vehicleCtrl.updateVehicle()
);

router.get(
  '/fetch-vehicles',
  auth.verify(),
  vehicleCtrl.fetchVehicles()
);

router.get(
  '/fetch-vehicle/:id',
  vehicleCtrl.fetchVehicle()
);

router.post(
  '/register-inspection/:vehicleId',
  auth.verify(),
  Validator.validateInspection(),
  val.validate(),
  vehicleCtrl.vehicleInspection()
);

router.get(
  '/view-inspection-history/:vehicleId',
  vehicleCtrl.fetchInspectionHistory()
);

router.post(
  '/approve-inspection/:vehicleId/:inspectionId',
  auth.verify(),
  vehicleCtrl.approveInspection()
);

router.get(
  '/approve-inspection/:vehicleId/:inspectionId',
  auth.verify(),
  vehicleCtrl.viewInspectionDetails()
);

router.post(
  '/record-route/:vehicleId',
  auth.verify(),
  Validator.validateRoutePlan(),
  val.validate(),
  vehicleCtrl.recordRoute()
);

router.post(
  '/start-route/:routeId',
  auth.verify(),
  Validator.startRoute(),
  val.validate(),
  vehicleCtrl.startRoute()
);

router.get(
  '/vehicle-performance/:vehicleId',
  auth.verify(),
  vehicleCtrl.fetchVehiclePerformance()
);

router.get(
  '/fetch-route-plan/:routeId',
  auth.verify(),
  vehicleCtrl.fetchRoutePlan()
);

router.post(
  '/assign-driver/:vehicleId',
  auth.verify(),
  Validator.assignDriver(),
  val.validate(),
  vehicleCtrl.assignDriver()
);

router.get(
  '/fetch-routePlans',
  auth.verify(),
  vehicleCtrl.RoutePlans()
);

router.delete(
  '/delete-vehicle/:vehicleId',
  auth.verify(),
  vehicleCtrl.deleteVehicle()
);

router.get(
  '/remove-driver/:vehicleId/:driver',
  auth.verify(),
  vehicleCtrl.removeDriver()
);

router.post(
  '/mark-route-as-complete/:routeId',
  auth.verify(),
  Validator.routeCompleted(),
  val.validate(),
  vehicleCtrl.markRouteAsComplete()
);

router.get(
  '/fetch-activityLogs/:userId',
  auth.verify(),
  vehicleCtrl.fetchActivityLogs()
);

router.get(
  '/fetch-all-vehicle',
  auth.verify(),
  vehicleCtrl.fetchallVehicles()
);

router.get(
  '/vehicle-routePlan/:vehicleId',
  auth.verify(),
  vehicleCtrl.vehicleRoutePlan()
);

router.post(
  '/create-delivery-note',
  auth.verify(),
  Validator.validateDeliveryNote(),
  val.validate(),
  vehicleCtrl.genWaybill()
);

router.get(
  '/fetch-delivery-notes',
  auth.verify(),
  vehicleCtrl.fetchWaybills()
);

router.get(
  '/delivery-note/:id',
  auth.verify(),
  vehicleCtrl.fetchDeliveryDetails()
);

router.get(
  '/complete-route-plan',
  auth.verify(),
  vehicleCtrl.marAsCompletedRoutePlan()
);

router.post(
  '/add-terretory',
  auth.verify(),
  vehicleCtrl.addTerritory()
);

router.get(
  '/fetch-terretories',
  auth.verify(),
  vehicleCtrl.fetchTerritory()
)

router.delete(
  '/delete-terretory/:terretory_id',
  auth.verify(),
  vehicleCtrl.deleteTerretory()
)

export default router;
