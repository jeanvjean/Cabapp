import { Router as expressRouter } from 'express';
import { Validator } from '../controllers/production';
import Auth from '../middlewares/authentication';
import { productionCtrl } from '../controllers';

const auth = new Auth;
const val = new Validator();
const router:expressRouter = expressRouter();


router.post(
  '/create-production-schedule',
  auth.verify(),
  Validator.validateProductionSchedule(),
  val.validate(),
  productionCtrl.createProductionSchedule()
);

router.post(
  '/approve-production-schedule',
  auth.verify(),
  Validator.validateApproval(),
  val.validate(),
  productionCtrl.approveProductionSchedule()
);

router.get(
  '/fetch-production-approvals',
  auth.verify(),
  productionCtrl.fetchPendingProductionApprovals()
);

router.get(
  '/fetch-prodctionSchedule/:productionId',
  productionCtrl.viewProductionSchedule()
);

router.get(
  '/fetch-production-schedules',
  auth.verify(),
  productionCtrl.fetchProductions()
);

router.post(
  '/update-completed-cylinders',
  auth.verify(),
  productionCtrl.markCompletedCylinders()
);

router.get(
  '/mark-completed-production/:productionId',
  auth.verify(),
  productionCtrl.markCompletedProduction()
);


export default router;
