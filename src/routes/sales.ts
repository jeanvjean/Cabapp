import { Router as expressRouter } from 'express';
import { salesCtrl } from '../controllers';
import { Validator } from '../controllers/sales';
import Auth from '../middlewares/authentication';
const val = new Validator();
const auth = new Auth();

const router:expressRouter = expressRouter();


router.post(
  '/create-sales-requisition',
  Validator.validateSales(),
  val.validate(),
  auth.verify(),
  salesCtrl.createSalesReq()
);

router.get(
  '/fetch-sales-requisitions',
  salesCtrl.fetchSalesReq()
);

router.get(
  '/fetch-sales-req/:salesId',
  salesCtrl.fetchRequisitionDetails()
);

router.post(
  '/approve-sales-requisition',
  auth.verify(),
  Validator.validateSales(),
  val.validate(),
  salesCtrl.approveSalesRequisition()
);

router.get(
  '/fetch-pending-req-approval',
  auth.verify(),
  salesCtrl.approveSalesRequisition()
);

export default router;
