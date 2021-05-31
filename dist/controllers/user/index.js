"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const ctrl_1 = require("../ctrl");
const validator_1 = require("./validator");
exports.Validator = validator_1.default;
const driver_1 = require("../driver");
const permissions = require('../../util/permissions.json');
class UserController extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    create() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = req;
                const user = yield this.module.register(body);
                this.ok(res, 'Registered successfully', user);
            }
            catch (error) {
                this.handleError(error, req, res);
            }
        });
    }
    inviteUser() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = req;
                //@ts-ignore
                const data = yield this.module.inviteUser(body, req.user);
                this.ok(res, 'Invitation sent', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    getConstantRoles() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchRoles(req.user);
                this.ok(res, 'Fetched successfully', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchUsers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchUsers(req.query, req.user);
                this.ok(res, 'Fetched Users', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    branchUsers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.branchUsers(req.query, req.user);
                this.ok(res, 'branch users', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchUser() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const user = yield this.module.fetchUser(req.params);
                this.ok(res, 'User details', user);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    login() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = req;
                const user = yield this.module.login(body);
                this.ok(res, 'Login successful', user);
            }
            catch (error) {
                this.handleError(error, req, res);
            }
        });
    }
    updateUser() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            //Todo: implement update function
            try {
                let image;
                if (req.files) {
                    //@ts-ignore
                    image = yield driver_1.uploadFile(req.files.image, 'profile_image/');
                }
                //@ts-ignore
                const data = yield this.module.updateUser(Object.assign(Object.assign({}, req.body), { image }), req.user);
                this.ok(res, 'Updated', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    changeUserRole() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                //@ts-ignore
                const data = yield this.module.changeUserRole(Object.assign(Object.assign({}, req.body), { userId }), req.user);
                this.ok(res, 'updated user role', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    requestPasswordReset() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.requestPasswordReset(req.body);
                this.ok(res, 'A link has been sent to your email', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    resetPassword() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.resetPassword(req.body);
                this.ok(res, 'Password changed', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    changePassword() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.changePassword(req.body, req.user);
                this.ok(res, 'Password changed', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    deleteUser() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.deleteUser(req.params.userId);
                this.ok(res, 'Deleted', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPermissions() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = permissions.permissions;
                this.ok(res, 'permissions fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    updateToken() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const user = req.user;
                // console.log(user);
                const { token } = req.params;
                const data = yield this.module.updateToken(user._id.toString(), token);
                this.ok(res, 'Token saved', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=index.js.map