import { Router as expressRouter } from "express";
import { ecrCtrl } from "../controllers";
import Auth from '../middlewares/authentication';
const auth = new Auth();

const router:expressRouter = expressRouter();

router.post(
    '/create-ecr',
    auth.verify(),
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
    '/fetch-all-ecr',
    auth.verify(),
    ecrCtrl.fetchEcrs()
)

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