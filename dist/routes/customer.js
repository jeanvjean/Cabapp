"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const customer_1 = require("../controllers/customer");
const auth = new authentication_1.default();
const val = new customer_1.Validator();
const router = express_1.Router();
router.post('/create-customer', auth.verify(), customer_1.Validator.validateCustomer(), val.validate(), controllers_1.customerCtrl.createCustomer());
router.get('/fetch-customers', auth.verify(), controllers_1.customerCtrl.fetchCustomers());
router.get('/fetch-customer/:customerId', controllers_1.customerCtrl.fetchCustomer());
router.post('/create-order', auth.verify(), customer_1.Validator.validateOrder(), val.validate(), controllers_1.customerCtrl.createOrder());
router.get('/fetch-order/:customerId', controllers_1.customerCtrl.fetchUserOrder());
router.post('/mark-order/:orderId', auth.verify(), controllers_1.customerCtrl.markOrder());
router.get('/fetch-order/:orderId', controllers_1.customerCtrl.orderDetails());
router.delete('/delete-pickup/:orderId', auth.verify(), controllers_1.customerCtrl.deletePickupOrder());
router.post('/assign-vehicle/:orderId', auth.verify(), controllers_1.customerCtrl.assignOrderToVehicle());
router.get('/fetch-vehicle-orders/:vehicleId', auth.verify(), controllers_1.customerCtrl.fetchOrdersForVehicle());
router.post('/make-complain/:customerId', auth.verify(), controllers_1.customerCtrl.createComplaint());
router.get('/get-all-pickup-orders', auth.verify(), controllers_1.customerCtrl.fetchCreatedOrders());
router.get('/fetch-complaints/:customerId', controllers_1.customerCtrl.fetchComplaints());
router.post('/approve-complaint/:complaintId', auth.verify(), controllers_1.customerCtrl.approveComplaint());
router.get('/fetch-pending-comment-approval', auth.verify(), controllers_1.customerCtrl.fetchPendingComplaintApproval());
router.get('/fetch-approved-complaints', auth.verify(), controllers_1.customerCtrl.fetchApprovedComplaints());
router.get('/resolve-complaint/:complaintId', auth.verify(), controllers_1.customerCtrl.resolveComplaint());
router.post('/register-walkin-customer', auth.verify(), customer_1.Validator.validateValkinCustomer(), val.validate(), controllers_1.customerCtrl.registerWalkinCustomer());
router.get('/fetch-walkin-customers', auth.verify(), controllers_1.customerCtrl.fetchWalkinCustomers());
router.get('/fetch-walkin-customer/:customerId', controllers_1.customerCtrl.fetchWalkinCustomer());
router.delete('/delete-walkin-customer/:customerId', auth.verify(), controllers_1.customerCtrl.deleteWalkinCustomer());
router.get('/mark-filled-cylinder/:customerId', auth.verify(), controllers_1.customerCtrl.markCustomerAsFilled());
router.get('/fetch-filled-walkincylinders', auth.verify(), controllers_1.customerCtrl.fetchFilledCustomerCylinders());
router.get('/fetch-all-customers', auth.verify(), controllers_1.customerCtrl.fetchallCustomers());
exports.default = router;
//# sourceMappingURL=customer.js.map