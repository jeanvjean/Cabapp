import { Router as expressRouter } from 'express';
import { Validator } from '../controllers/ocn';
import { ocnController } from '../controllers'
import Auth from '../middlewares/authentication';


const auth = new Auth();
const val = new Validator();
const router:expressRouter = expressRouter();

router.post(
    '/create-ocn',
    auth.verify(),
    Validator.validateOcn(),
    val.validate(),
    ocnController.recordOcn(),
);

router.post(
    '/approve-ocn/:ocnId',
    auth.verify(),
    Validator.validateApproval(),
    val.validate(),
    ocnController.approveOcn()
);

router.get(
    '/fetch-ocn-approvals',
    auth.verify(),
    ocnController.fetchOcnApprovals()
);

router.get(
    '/fetch-ocn-details/:ocnId',
    auth.verify(),
    ocnController.fetchOcnDetails()
);


export default router;