import { Router as expressRouter } from 'express';
import { Validator } from '../controllers/scan';
import Auth from '../middlewares/authentication';
import { scanCtrl } from '../controllers';

const auth = new Auth();
const val = new Validator();


const router:expressRouter = expressRouter();


router.get(
    '/scan-cylinder',
    auth.verify(),
    Validator.validateScan(),
    val.validate(),
    scanCtrl.startScan()
);

router.get(
    '/fetch-scans',
    auth.verify(),
    scanCtrl.fetchScans()
);

router.get(
    '/scan-info/:formId',
    auth.verify(),
    scanCtrl.scanInfo()
);

router.get(
    '/complete-scan/:formId',
    auth.verify(),
    scanCtrl.complete()
);

router.get(
    '/initiate-scan',
    auth.verify(),
    scanCtrl.initiateScan()
);

router.post(
    '/update-scan',
    auth.verify(),
    Validator.updateScan(),
    val.validate(),
    scanCtrl.update()
);

export default router;