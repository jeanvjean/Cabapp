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
  auth.verify(),
  customerCtrl.fetchCustomers()
);

router.get(
  '/fetch-customer/:customerId',
  customerCtrl.fetchCustomer()
);

router.post(
  '/create-order',
  auth.verify(),
  Validator.validateOrder(),
  val.validate(),
  customerCtrl.createOrder()
);

router.get(
  '/fetch-order/:customerId',
  customerCtrl.fetchUserOrder()
);

router.post(
  '/mark-order/:orderId',
  auth.verify(),
  Validator.markOrder(),
  val.validate(),
  customerCtrl.markOrder()
);

router.get(
  '/fetch-order/:orderId',
  customerCtrl.orderDetails()
);

router.delete(
  '/delete-pickup/:orderId',
  auth.verify(),
  customerCtrl.deletePickupOrder()
);

router.post(
  '/assign-vehicle/:orderId',
  auth.verify(),
  customerCtrl.assignOrderToVehicle()
);

router.get(
  '/fetch-vehicle-orders/:vehicleId',
  auth.verify(),
  customerCtrl.fetchOrdersForVehicle()
);

router.post(
  '/make-complain/:customerId',
  auth.verify(),
  Validator.makeComplaint(),
  val.validate(),
  customerCtrl.createComplaint()
);

router.get(
  '/get-all-pickup-orders',
  auth.verify(),
  customerCtrl.fetchCreatedOrders()
);

router.get(
  '/fetch-complaints',
  auth.verify(),
  customerCtrl.fetchComplaints()
);

router.post(
  '/approve-complaint',
  auth.verify(),
  Validator.approveComplaint(),
  val.validate(),
  customerCtrl.approveComplaint()
);

router.get(
  '/fetch-pending-complaint-approval',
  auth.verify(),
  customerCtrl.fetchPendingComplaintApproval()
);

router.get(
  '/fetch-approved-complaints',
  auth.verify(),
  customerCtrl.fetchApprovedComplaints()
);

router.get(
  '/resolve-complaint/:complaintId',
  auth.verify(),
  customerCtrl.resolveComplaint()
);

router.post(
  '/register-walkin-customer',
  auth.verify(),
  customerCtrl.registerWalkinCustomer()
);

router.post(
  '/update-walkin-customer/:customerId',
  auth.verify(),
  customerCtrl.updateWalkinCustomer()
);

router.get(
  '/fetch-walkin-customers',
  auth.verify(),
  customerCtrl.fetchWalkinCustomers()
);

router.get(
  '/fetch-walkin-customer/:icnNo',
  customerCtrl.fetchWalkinCustomer()
);

router.delete(
  '/delete-walkin-customer/:customerId',
  auth.verify(),
  customerCtrl.deleteWalkinCustomer()
);

router.get(
  '/mark-filled-cylinder/:customerId',
  auth.verify(),
  customerCtrl.markCustomerAsFilled()
);

router.get(
  '/fetch-filled-walkincylinders',
  auth.verify(),
  customerCtrl.fetchFilledCustomerCylinders()
);

router.get(
  '/fetch-all-customers',
  auth.verify(),
  customerCtrl.fetchallCustomers()
);

router.get(
  '/fetch-complaint-details/:complaintId',
  auth.verify(),
  customerCtrl.fetchComplaintDetails()
);

router.delete(
  '/delete-customer/:customerId',
  auth.verify(),
  customerCtrl.deleteCustomer()
);

router.get(
  '/fetch-deleted-customers',
  auth.verify(),
  customerCtrl.fetchDeletedCustomers()
);

router.get(
  '/fetch-order-history',
  auth.verify(),
  customerCtrl.fetchOrderHistory()
);

export default router;
