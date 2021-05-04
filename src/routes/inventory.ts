import { Router as expressRouter } from 'express';
import Auth from '../middlewares/authentication';
import {productCtrl} from '../controllers'
import { Validator } from '../controllers/inventory';
const auth = new Auth();
const router:expressRouter = expressRouter();

const val = new Validator();

router.post(
  '/create-product',
  Validator.validateProduct(),
  val.validate(),
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
  '/fetch-pending-disburse-requests',
  auth.verify(),
  productCtrl.fetchUserDisburseRequests()
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

router.get(
  '/fetch-disbursement-report',
  productCtrl.disburseReport()
);

router.post(
  '/create-branch',
  productCtrl.createBranch()
);

router.get(
  '/fetch-branches',
  productCtrl.fetchBranches()
);

router.get(
  '/fetch-suppliers',
  productCtrl.fetchSuppliers()
);
router.post(
  '/update-supplier/:supplierId',
  productCtrl.updateSupplier()
);

router.delete(
  '/remove-supplier/:supplierId',
  productCtrl.deleteSupplier()
);

router.post(
  '/update-product/:productId',
  productCtrl.updateProduct()
);

router.delete(
  '/delete-product/:productId',
  productCtrl.deleteProduct()
);

router.get(
  '/fetch-restock-requests',
  productCtrl.fetchProductsRequest()
);

export default router;
