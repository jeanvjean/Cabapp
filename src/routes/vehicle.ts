import { Router as expressRouter } from 'express';
import Auth from '../middlewares/authentication';
import { vehicleCtrl } from '../controllers';
const auth = new Auth();

const router:expressRouter = expressRouter();

router.post(
  '/register-vehicle',
  auth.verify(),
  vehicleCtrl.createVehicle()
);

router.get(
  '/fetch-vehicles',
  vehicleCtrl.fetchVehicles()
);

router.get(
  '/fetch-vehicle/:id',
  vehicleCtrl.fetchVehicle()
);

router.post(
  '/register-inspection/:vehicleId',
  auth.verify(),
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

router.post(
  '/record-route/:vehicleId',
  auth.verify(),
  vehicleCtrl.recordRoute()
);

router.post(
  '/assign-driver/:vehicleId',
  auth.verify(),
  vehicleCtrl.assignDriver()
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
  '/mark-route-as-complete/:vehicleId/:routeId',
  auth.verify(),
  vehicleCtrl.markRouteAsComplete()
);

export default router;
