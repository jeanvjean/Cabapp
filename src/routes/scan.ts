import { Router as expressRouter } from 'express';
import { Validator } from '../controllers/scan';
import Auth from '../middlewares/authentication';
import { scanCtrl } from '../controllers';

const auth = new Auth();
const val = new Validator();


const router:expressRouter = expressRouter();


router.get(
    '/scan-cylinder',
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
    scanCtrl.complete()
);

router.get(
    '/initiate-scan',
    scanCtrl.initiateScan()
);

router.post(
    '/update-scan',
    scanCtrl.update()
);

export default router;