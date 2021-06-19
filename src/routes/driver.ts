import { Router as expressRouter } from 'express';
import Auth from '../middlewares/authentication';
import { driverCtrl } from '../controllers';

const auth = new Auth();

const router:expressRouter = expressRouter();

router.post(
  '/create-driver',
  auth.verify(),
  driverCtrl.createDriver()
);

router.delete(
  '/delete-driver/:driverId',
  auth.verify(),
  driverCtrl.deleteDriver()
);

router.get(
  '/fetch-drivers',
  auth.verify(),
  driverCtrl.fetchDrivers()
);

router.get(
  '/fetch-driver/:driverId',
  auth.verify(),
  driverCtrl.fetchDriver()
);

router.get(
  '/fetch-all-drivers',
  auth.verify(),
  driverCtrl.fetchallDrivers()
);


export default router;
