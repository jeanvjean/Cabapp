"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const user_1 = require("../controllers/user");
const authentication_1 = require("../middlewares/authentication");
const val = new user_1.Validator();
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/register', user_1.Validator.validateUser(), val.validate(), controllers_1.userCtrl.create());
router.post('/login', user_1.Validator.validateLogin(), val.validate(), controllers_1.userCtrl.login());
router.post('/invite-user', auth.verify(), user_1.Validator.validateInvite(), val.validate(), controllers_1.userCtrl.inviteUser());
router.get('/get-roles', auth.verify(), controllers_1.userCtrl.getConstantRoles());
router.get('/get-users', auth.verify(), controllers_1.userCtrl.fetchUsers());
router.get('/get-branch-users', auth.verify(), controllers_1.userCtrl.branchUsers());
router.get('/user-details/:id/:email', auth.verify(), controllers_1.userCtrl.fetchUser());
router.post('/update-user/:id', user_1.Validator.validateUserUpdate(), val.validate(), auth.verify(), controllers_1.userCtrl.updateUser());
router.post('/change-role/:userId', user_1.Validator.validateRoleChange(), val.validate(), auth.verify(), controllers_1.userCtrl.changeUserRole());
router.post('/request-password-reset', controllers_1.userCtrl.requestPasswordReset());
router.post('/reset-password', user_1.Validator.validatePassword(), val.validate(), controllers_1.userCtrl.resetPassword());
router.post('/change-password', user_1.Validator.validatePasswordChange(), val.validate(), auth.verify(), controllers_1.userCtrl.changePassword());
router.delete('/delete-user/:userId', controllers_1.userCtrl.deleteUser());
router.get('/fetch-permissions', controllers_1.userCtrl.fetchPermissions());
router.get('/register-token/:token', auth.verify(), controllers_1.userCtrl.updateToken());
router.get('/suspend/:userId', auth.verify(), controllers_1.userCtrl.suspendUser());
router.get('/fetch-all-users', auth.verify(), controllers_1.userCtrl.fetchallUsers());
exports.default = router;
//# sourceMappingURL=user.js.map