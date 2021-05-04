import { Router as expressRouter } from 'express';
import { userCtrl } from '../controllers';
import { Validator } from '../controllers/user';
import Auth from '../middlewares/authentication';
const val = new Validator();
const auth = new Auth();

const router: expressRouter = expressRouter();

  router.post('/register',
      Validator.validateUser(),
      val.validate(),
      userCtrl.create()
    );

  router.post('/login',
      Validator.validateLogin(),
      val.validate(),
      userCtrl.login()
  );

  router.post('/invite-user',
      auth.verify(),
      Validator.validateInvite(),
      val.validate(),
      userCtrl.inviteUser()
  );

  router.get('/get-roles', auth.verify(), userCtrl.getConstantRoles());

  router.get('/get-users', auth.verify(), userCtrl.fetchUsers());

  router.get('/user-details/:id/:email', auth.verify(), userCtrl.fetchUser());

  router.post('/update-user/:id', auth.verify(), userCtrl.updateUser());

  router.post('/request-password-reset', userCtrl.requestPasswordReset());

  router.post('/reset-password',
      Validator.validatePassword(),
      val.validate(),
      userCtrl.resetPassword()
  );

  router.post('/change-password',
      Validator.validatePasswordChange(),
      val.validate(),
      auth.verify(),
      userCtrl.changePassword()
    );

  router.delete(
    '/delete-user/:userId',
    userCtrl.deleteUser()
  );

  router.get(
    '/fetch-permissions',
    userCtrl.fetchPermissions()
  );

export default router;
