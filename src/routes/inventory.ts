import { Router as expressRouter } from 'express';
import Auth from '../middlewares/authentication';
import {productCtrl} from '../controllers'
const auth = new Auth();
const router:expressRouter = expressRouter();

router.post(
  '/create-product',
  auth.verify(),
  productCtrl.createProduct()
);

router.get(
  '/fetch-products',
  productCtrl.fetchProducts()
);

router.get(
  '/fetch-product/:id',
  productCtrl.fetchProduct()
);

router.post(
  '/create-supplier',
  productCtrl.createSupplier()
);

router.post(
  '/register-inventory',
  auth.verify(),
  productCtrl.addInventory()
);

router.post(
  '/disburse-products',
  auth.verify(),
  productCtrl.disburseProducts()
);

router.post(
  '/approve-disbursement',
  auth.verify(),
  productCtrl.approveDisbursement()
);

router.get(
  '/fetch-pending-disburse',
  auth.verify(),
  productCtrl.fetchDisburseApprovals()
);

router.get(
  '/fetch-disburse-requests',
  auth.verify(),
  productCtrl.fetchDisbursements()
);

router.get(
  '/fetch-disbursement/:id',
  productCtrl.fetchDisbursement()
);

export default router;
