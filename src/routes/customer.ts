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
  '/create-order/:customerId',
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
  customerCtrl.markOrder()
);

router.get(
  '/fetch-order/:orderId',
  customerCtrl.orderDetails()
);

router.post(
  '/make-complain/:customerId',
  auth.verify(),
  customerCtrl.createComplaint()
);

router.get(
  '/fetch-complaints/:customerId',
  customerCtrl.fetchComplaints()
);

router.post(
  '/approve-complaint/:complaintId',
  auth.verify(),
  customerCtrl.approveComplaint()
);

router.get(
  '/fetch-pending-comment-approval',
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
  customerCtrl.resolveComplaint()
);

router.post(
  '/register-walkin-customer',
  auth.verify(),
  Validator.validateValkinCustomer(),
  val.validate(),
  customerCtrl.registerWalkinCustomer()
);

router.get(
  '/fetch-walkin-customers',
  auth.verify(),
  customerCtrl.fetchWalkinCustomers()
);

router.get(
  '/fetch-walkin-customer/:customerId',
  customerCtrl.fetchWalkinCustomer()
);

router.delete(
  '/delete-walkin-customer/:customerId',
  customerCtrl.deleteWalkinCustomer()
);

router.get(
  '/mark-filled-cylinder/:customerId',
  customerCtrl.markCustomerAsFilled()
);

router.get(
  '/fetch-filled-walkincylinders',
  auth.verify(),
  customerCtrl.fetchFilledCustomerCylinders()
);

export default router;
