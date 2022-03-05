import {Router as expressRouter} from 'express';
import Auth from '../middlewares/authentication';
import {purchaseCtrl} from '../controllers';
import {Validator} from '../controllers/purchaseOrder';

const auth = new Auth();
const val = new Validator();


const router: expressRouter = expressRouter();

router.post(
  '/create-purchase-order',
  auth.verify(),
  Validator.validatePurchase(),
  val.validate(),
  purchaseCtrl.createPurchserOrder()
);

router.get(
  '/fetch-purchase-orders',
  auth.verify(),
  purchaseCtrl.fetchPurchases()
);

router.post(
  '/approve-purchase-order/:purchaseId',
  auth.verify(),
  Validator.approvePurchaseOrder(),
  val.validate(),
  purchaseCtrl.approvePurchaseOrder()
);

router.get(
  '/fetch-purchase-approvals',
  auth.verify(),
  purchaseCtrl.fetchPurchaseApprovals()
);

router.get(
  '/fetch-order/:orderId',
  auth.verify(),
  purchaseCtrl.viewOrderDetails()
);


export default router;
