import {Router as expressRouter} from 'express';
import {Validator} from '../controllers/account';
import Auth from '../middlewares/authentication';
import {accountCtrl} from '../controllers';

const auth = new Auth();
const val = new Validator();

const router: expressRouter = expressRouter();

router.post(
  '/create-invoice',
  auth.verify(),
  Validator.validateInvoice(),
  val.validate(),
  accountCtrl.createInvoice()
);

router.get(
  '/fetch-invoices',
  auth.verify(),
  accountCtrl.fetchInvoices()
);

router.get(
  '/fetch-invoice/:invoiceId',
  auth.verify(),
  accountCtrl.fetchInvoiceDetails()
);

router.post(
  '/update-payment/:invoiceId',
  auth.verify(),
  Validator.validateUpdate(),
  val.validate(),
  accountCtrl.updateInvoice()
);

export default router;
