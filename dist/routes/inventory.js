"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const inventory_1 = require("../controllers/inventory");
const auth = new authentication_1.default();
const router = express_1.Router();
const val = new inventory_1.Validator();
router.post('/create-product', inventory_1.Validator.validateProduct(), val.validate(), auth.verify(), controllers_1.productCtrl.createProduct());
router.get('/fetch-products', auth.verify(), controllers_1.productCtrl.fetchProducts());
router.get('/fetch-product/:id', controllers_1.productCtrl.fetchProduct());
router.post('/create-supplier', auth.verify(), controllers_1.productCtrl.createSupplier());
router.post('/register-inventory', auth.verify(), inventory_1.Validator.validateUpdateInventory(), val.validate(), controllers_1.productCtrl.addInventory());
router.get('/fetch-inventories', auth.verify(), controllers_1.productCtrl.fetchInventories());
router.get('/fetch-inventory/:inventoryId', auth.verify(), controllers_1.productCtrl.fetchInventoryDetail());
router.post('/disburse-products', auth.verify(), controllers_1.productCtrl.disburseProducts());
router.post('/approve-disbursement', auth.verify(), inventory_1.Validator.approveInput(), val.validate(), controllers_1.productCtrl.approveDisbursement());
router.get('/fetch-pending-disburse', auth.verify(), controllers_1.productCtrl.fetchDisburseApprovals());
router.get('/fetch-pending-disburse-requests', auth.verify(), controllers_1.productCtrl.fetchUserDisburseRequests());
router.get('/fetch-disburse-requests', auth.verify(), controllers_1.productCtrl.fetchDisbursements());
router.get('/fetch-disbursement/:id', controllers_1.productCtrl.fetchDisbursement());
router.get('/fetch-disbursement-report', auth.verify(), controllers_1.productCtrl.disburseReport());
router.post('/create-branch', controllers_1.productCtrl.createBranch());
router.get('/fetch-branches', controllers_1.productCtrl.fetchBranches());
router.get('/fetch-suppliers', auth.verify(), controllers_1.productCtrl.fetchSuppliers());
router.post('/update-supplier/:supplierId', auth.verify(), controllers_1.productCtrl.updateSupplier());
router.delete('/remove-supplier/:supplierId', auth.verify(), controllers_1.productCtrl.deleteSupplier());
router.post('/update-product/:productId', auth.verify(), controllers_1.productCtrl.updateProduct());
router.delete('/delete-product/:productId', auth.verify(), controllers_1.productCtrl.deleteProduct());
router.get('/fetch-restock-requests', auth.verify(), controllers_1.productCtrl.fetchProductsRequest());
router.get('/inventory-stats', auth.verify(), controllers_1.productCtrl.inventoryStats());
router.get('/fetch-all-products', auth.verify(), controllers_1.productCtrl.fetchallProducts());
router.get('/supplier-details/:supplierId', auth.verify(), controllers_1.productCtrl.supplierDetails());
exports.default = router;
//# sourceMappingURL=inventory.js.map