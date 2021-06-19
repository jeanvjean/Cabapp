import { Router as expressRouter } from 'express';
import { cylinderCtrl } from '../controllers';
import { Validator } from '../controllers/cylinder';
import Auth from '../middlewares/authentication';
const val = new Validator();
const auth = new Auth();


const router:expressRouter = expressRouter();

router.post('/create-cylinder',
  Validator.validateCylinder(),
  val.validate(),
  auth.verify(),
  cylinderCtrl.createCylinder()
);

router.get('/fetch-cylinders', cylinderCtrl.fetchCylinders());

router.get('/get-cylinder/:id', cylinderCtrl.cylinderDetails());

router.post('/register-cylinder',
  Validator.validateCylinderRegisteration(),
  val.validate(),
  auth.verify(),
  cylinderCtrl.registerCylinder()
);

router.get('/fetch-registered-cylinders',
  auth.verify(),
  cylinderCtrl.fetchRegisteredCylinders()
);

router.get('/registered-cylinder-details/:id',
  auth.verify(),
  cylinderCtrl.fetchRegisteredCylinder()
);

router.post('/transfer-cylinders',
  auth.verify(),
  Validator.validateCylinderTransfer(),
  val.validate(),
  cylinderCtrl.transferCylinder()
);

router.post('/approve-transfer',
  auth.verify(),
  Validator.validateApproval(),
  val.validate(),
  cylinderCtrl.approveTransfer()
);

router.get('/fetch-transfers',
  cylinderCtrl.fetchTransferRequests()
);

router.get(
  '/fetch-transfer/:id',
  cylinderCtrl.fetchTransferDetails()
);

router.get(
  '/pending-approval',
  auth.verify(),
  cylinderCtrl.usersPendingApprovals()
);

router.delete(
  '/remove-cylinder/:cylinderId',
  auth.verify(),
  cylinderCtrl.deleteRegisteredCylinder()
);

router.get(
  '/fetch-faulty-cylinders',
  auth.verify(),
  cylinderCtrl.fetchFaultyCylinders()
);

router.get(
  '/fetch-customer-cylinders/:customerId',
  cylinderCtrl.fetchCustomerCylinders()
);

router.post(
  '/update-reg-cylinder/:cylinderId',
  auth.verify(),
  cylinderCtrl.updateRegCylinder()
);

router.get(
  '/fetch-cylinder-transfer-report',
  auth.verify(),
  cylinderCtrl.fetchCompletedTransfers()
);

router.get(
  '/mark-faulty-cylinder/:cylinderId',
  auth.verify(),
  cylinderCtrl.faultyCylinder()
);

router.get(
  '/condemn-cylinder/:cylinderId',
  cylinderCtrl.condemnCylinder()
);

router.get(
  '/fetch-archived-cylinders',
  auth.verify(),
  cylinderCtrl.fetchCondemnCylinders()
);

router.get(
  '/fixed-cylinder/:cylinderId',
  auth.verify(),
  cylinderCtrl.fixFaultyCylinder()
);

router.get(
  '/fetch-cylinder-stats',
  auth.verify(),
  cylinderCtrl.cylinderStats()
);
router.get(
  '/returned-cylinder/:cylinderId',
  auth.verify(),
  cylinderCtrl.cylinderReturned()
);

router.get(
  '/cylinder-transfer-stats',
  auth.verify(),
  cylinderCtrl.transferCylinderStats()
);

router.post(
  '/returning-cylinders',
  auth.verify(),
  cylinderCtrl.returnCylinder()
);

router.get(
  '/fetch-reg-cylinders',
  auth.verify(),
  cylinderCtrl.fetchRegistredCylindersWP()
);

export default router;
