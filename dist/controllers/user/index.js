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
                this.ok(res, 'ok', user);
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
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', user);
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
                this.ok(res, 'ok', user);
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
                //@ts-ignore
                const data = yield this.module.updateUser(req.body, req.user);
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=index.js.map