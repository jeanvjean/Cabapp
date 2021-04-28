import { Router as expressRouter } from 'express';
import Auth from '../middlewares/authentication';
import { customerCtrl } from '../controllers';
import { Validator } from '../controllers/customer';
const auth = new Auth();
const val = new Validator();

const router:expressRouter = expressRouter();


router.post(
  '/create-customer',
  auth.verify(),
  Validator.validateCustomer(),
  val.validate(),
  customerCtrl.createCustomer()
);

router.get(
  '/fetch-customers',
  customerCtrl.fetchCustomers()
);

router.get(
  '/fetch-customer/:customerId',
  customerCtrl.fetchCustomer()
);

router.post(
  '/create-order/:customerId',
  auth.verify(),
  customerCtrl.createOrder()
);

router.get(
  '/fetch-order/:customerId',
  customerCtrl.fetchUserOrder()
);

export default router;
