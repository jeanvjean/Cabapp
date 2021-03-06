import {Router as expressRouter} from 'express';
import Auth from '../middlewares/authentication';
import {productCtrl} from '../controllers';
import {Validator} from '../controllers/inventory';
import {product} from '../modules';
const auth = new Auth();
const router: expressRouter = expressRouter();

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
  auth.verify(),
  productCtrl.fetchProducts()
);

router.get(
  '/fetch-product/:id',
  productCtrl.fetchProduct()
);

router.post(
  '/create-supplier',
  auth.verify(),
  Validator.createSupplier(),
  val.validate(),
  productCtrl.createSupplier()
);

router.post(
  '/register-inventory',
  auth.verify(),
  Validator.validateUpdateInventory(),
  val.validate(),
  productCtrl.addInventory()
);

router.get(
  '/fetch-inventories',
  auth.verify(),
  productCtrl.fetchInventories()
);

router.get(
  '/fetch-inventory/:inventoryId',
  auth.verify(),
  productCtrl.fetchInventoryDetail()
);

router.post(
  '/disburse-products',
  auth.verify(),
  Validator.validateProductDisbursal(),
  val.validate(),
  productCtrl.disburseProducts()
);

router.post(
  '/approve-disbursement',
  auth.verify(),
  Validator.approveInput(),
  val.validate(),
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
  auth.verify(),
  productCtrl.disburseReport()
);

router.get(
  '/fetch-restock-report',
  auth.verify(),
  productCtrl.restockReport()
);

router.post(
  '/create-branch',
  Validator.createBranch(),
  val.validate(),
  productCtrl.createBranch()
);

router.get(
  '/fetch-branches',
  productCtrl.fetchBranches()
);

router.get(
  '/fetch-suppliers',
  auth.verify(),
  productCtrl.fetchSuppliers()
);
router.post(
  '/update-supplier/:supplierId',
  auth.verify(),
  Validator.updateSupplier(),
  val.validate(),
  productCtrl.updateSupplier()
);

router.delete(
  '/remove-supplier/:supplierId',
  auth.verify(),
  productCtrl.deleteSupplier()
);

router.post(
  '/update-product/:productId',
  auth.verify(),
  Validator.updateProduct(),
  val.validate(),
  productCtrl.updateProduct()
);

router.delete(
  '/delete-product/:productId',
  auth.verify(),
  productCtrl.deleteProduct()
);

router.get(
  '/fetch-restock-requests',
  auth.verify(),
  productCtrl.fetchProductsRequest()
);

router.get(
  '/inventory-stats',
  auth.verify(),
  productCtrl.inventoryStats()
);

router.get(
  '/fetch-all-products',
  auth.verify(),
  productCtrl.fetchallProducts()
);

router.get(
  '/supplier-details/:supplierId',
  auth.verify(),
  productCtrl.supplierDetails()
);

router.get(
  '/fetch-all-suppliers',
  auth.verify(),
  productCtrl.fetchAllSuppliers()
);

router.get(
  '/fetch-mrn-stats',
  auth.verify(),
  productCtrl.mrnStats()
);

router.get(
  '/fetch-grn-stats',
  auth.verify(),
  productCtrl.grnStats()
);

router.post(
  '/approve-grn',
  auth.verify(),
  Validator.approveGrn(),
  val.validate(),
  productCtrl.approveGrn()
);

export default router;
