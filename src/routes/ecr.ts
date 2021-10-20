import { Router as expressRouter } from "express";
import { ecrCtrl } from "../controllers";
import Auth from '../middlewares/authentication';
import { Validator } from '../controllers/ecr';
const auth = new Auth();
const val = new Validator()

const router:expressRouter = expressRouter();

router.post(
    '/create-ecr',
    auth.verify(),
    Validator.createEcr(),
    val.validate(),
    ecrCtrl.createEcr()
);

router.get(
    '/fetch-ecr',
    auth.verify(),
    ecrCtrl.fetchEcr()
);

router.post(
    '/approve-ecr',
    auth.verify(),
    Validator.approveEcr(),
    val.validate(),
    ecrCtrl.approveEcr()
);

router.get(
    '/ecr-details/:ecrId',
    auth.verify(),
    ecrCtrl.ecrDetails()
);

router.get(
    '/fetch-ecr-approvals',
    auth.verify(),
    ecrCtrl.fetchPendingApprovals()
);

router.get(
    '/fetch-tecr',
    auth.verify(),
    ecrCtrl.fetchEcrs()
)
//Route not recorded
router.get(
    '/fetch-complaint-ecr',
    auth.verify(),
    ecrCtrl.complaintEcr()
);

router.get(
    '/tecr-details/:ecrNo',
    auth.verify(),
    ecrCtrl.fetchTEcrDetails()
)

router.get(
    '/submit-otp/:tecrId/:otp',
    auth.verify(),
    ecrCtrl.completeTecr()
);

export default router;