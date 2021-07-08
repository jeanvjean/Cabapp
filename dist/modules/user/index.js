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
exports.signTokenKey = void 0;
const module_1 = require("../module");
const exceptions_1 = require("../../exceptions");
const jsonwebtoken_1 = require("jsonwebtoken");
const mail_1 = require("../../util/mail");
const token_1 = require("../../util/token");
const constants_1 = require("../../util/constants");
const static_1 = require("../../configs/static");
const bcryptjs_1 = require("bcryptjs");
const resolve_template_1 = require("../../util/resolve-template");
const logs_1 = require("../../util/logs");
exports.signTokenKey = "loremipsumdolorsitemet";
class User extends module_1.default {
    constructor(props) {
        super();
        this.user = props.user;
    }
    register(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let newUser;
            try {
                let existUser = yield this.user.findOne({ email: data.email });
                if (existUser) {
                    throw new exceptions_1.BadInputFormatException('A user already exists with this email');
                }
                newUser = yield this.user.create(Object.assign(Object.assign({}, data), { subrole: 'superadmin', isVerified: true }));
                // let payload = {
                //   id:newUser._id,
                //   email:newUser.email
                // }
                // const expiresIn = 1000 * 60 * 60 * 24;
                // let token = sign(payload, signTokenKey, {expiresIn});
                // const html = await getTemplate('registration', {
                //   name: newUser.name,
                //   link:`${Environment.FRONTEND_URL}/verify/${token}`
                // });
                // let mailLoad = {
                //   content:html,
                //   subject:'test messaging',
                //   email:newUser.email,
                // }
                // new Notify().sendMail(mailLoad);
                return Promise.resolve(newUser);
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
    inviteUser(data, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const branch = yield this.user.findById(userInfo._id).populate({
                    path: 'branch', model: 'branches'
                });
                const exists = [];
                for (let user of data.users) {
                    let existUser = yield this.user.findOne({ email: user.email });
                    if (existUser) {
                        if (!existUser.isVerified) {
                            let password = yield token_1.generateToken(4);
                            //@ts-ignore
                            yield this.user.findByIdAndUpdate(existUser._id, { password }, { new: true });
                            const html = yield resolve_template_1.getTemplate('invite', {
                                team: user.role,
                                role: user.subrole,
                                email: user.email,
                                link: `${static_1.default.FRONTEND_URL}`,
                                //@ts-ignore
                                branch: branch === null || branch === void 0 ? void 0 : branch.branch.name,
                                password
                            });
                            let mailLoad = {
                                content: html,
                                subject: 'RE:Invitiation',
                                email: user.email,
                            };
                            new mail_1.default().sendMail(mailLoad);
                        }
                        else {
                            exists.push(user.email);
                        }
                    }
                    else {
                        if (user.subrole == 'head of department') {
                            let hod = yield this.user.findOne({
                                role: user.role,
                                subrole: user.subrole,
                                branch: branch === null || branch === void 0 ? void 0 : branch.branch
                            });
                            if (!hod) {
                                let password = yield token_1.generateToken(4);
                                //@ts-ignore
                                yield this.user.create(Object.assign(Object.assign({}, user), { branch: branch === null || branch === void 0 ? void 0 : branch.branch._id, password }));
                                const html = yield resolve_template_1.getTemplate('invite', {
                                    team: user.role,
                                    role: user.subrole,
                                    email: user.email,
                                    link: `${static_1.default.FRONTEND_URL}`,
                                    //@ts-ignore
                                    branch: branch === null || branch === void 0 ? void 0 : branch.branch.name,
                                    password
                                });
                                let mailLoad = {
                                    content: html,
                                    subject: 'New User registeration',
                                    email: user.email,
                                };
                                new mail_1.default().sendMail(mailLoad);
                            }
                            else {
                                exists.push(user.email);
                            }
                        }
                        else {
                            let password = yield token_1.generateToken(4);
                            //@ts-ignore
                            yield this.user.create(Object.assign(Object.assign({}, user), { branch: branch === null || branch === void 0 ? void 0 : branch.branch._id, password }));
                            const html = yield resolve_template_1.getTemplate('invite', {
                                team: user.role,
                                role: user.subrole,
                                email: user.email,
                                link: `${static_1.default.FRONTEND_URL}`,
                                //@ts-ignore
                                branch: branch === null || branch === void 0 ? void 0 : branch.branch.name,
                                password
                            });
                            let mailLoad = {
                                content: html,
                                subject: 'New User registeration',
                                email: user.email,
                            };
                            new mail_1.default().sendMail(mailLoad);
                        }
                    }
                }
                yield logs_1.createLog({
                    user: userInfo._id,
                    activities: {
                        title: 'Invited new Users',
                        activity: 'You invited some new users to join the team',
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve({
                    message: 'An email has been sent to your new user(s)',
                    failedInvites: exists
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchRoles(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                let roles = constants_1.constants;
                return Promise.resolve(roles);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchUsers(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                let options = Object.assign({}, query);
                let users;
                if ((search === null || search === void 0 ? void 0 : search.length) !== undefined) {
                    //@ts-ignore
                    users = yield this.user.paginate({ $or: [{ role: search }, { subrole: search }, { branch: search }] }, options);
                }
                else {
                    //@ts-ignore
                    users = yield this.user.paginate({}, options);
                }
                return users;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    branchUsers(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { search } = query;
                let options = Object.assign({}, query);
                //@ts-ignore
                let users;
                if ((search === null || search === void 0 ? void 0 : search.length) !== undefined) {
                    //@ts-ignore
                    users = yield this.user.paginate({ branch: user.branch, $or: [{ role: search }, { subrole: search }, { branch: search }] }, options);
                }
                else {
                    //@ts-ignore
                    users = yield this.user.paginate({ branch: user.branch }, options);
                }
                return users;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = data;
                let user = yield this.user.findOne({ email: email }).select('+password');
                if (!user) {
                    throw new exceptions_1.BadInputFormatException('User Not Found');
                }
                // if(!user.isVerified) {
                //   throw new BadInputFormatException('Account has not been verified');
                // }
                let correctPassword = yield user.comparePWD(password);
                if (!correctPassword) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password');
                }
                let payload = {
                    id: user._id.toString(),
                    email: user.email.toString()
                };
                let expiresIn = 1000 * 60 * 60 * 24;
                let token = jsonwebtoken_1.sign(payload, exports.signTokenKey, { expiresIn });
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Logged in',
                        activity: 'You logged into your account',
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve({
                    user,
                    accessToken: {
                        token,
                        expires: expiresIn
                    }
                });
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
    fetchUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.user.findOne({
                _id: data.id,
                email: data.email
            });
            if (!user) {
                throw new exceptions_1.BadInputFormatException('No User found');
            }
            return Promise.resolve(user);
        });
    }
    updateUser(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            //Todo implement user update
            try {
                let options = { new: true };
                // @ts-ignore
                let exists = yield this.user.findById(user._id);
                if (!exists) {
                    throw new exceptions_1.BadInputFormatException('Not Found');
                }
                //@ts-ignore
                if (data.email && user.email !== data.email) {
                    //@ts-ignore
                    let thisUser = yield this.user.findOne({ email: data.email });
                    if (thisUser) {
                        throw new exceptions_1.BadInputFormatException('the email is in use by another client');
                    }
                }
                let set = Object.assign(Object.assign({}, data), { isVerified: true });
                let updateUser = yield this.user.findByIdAndUpdate(user._id, {
                    $set: set
                }, options);
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Update profine',
                        activity: 'You updated your profile',
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(updateUser);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    changeUserRole(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let updatedUser;
                const user = yield this.user.findById(data.userId);
                if (!user) {
                    throw new exceptions_1.BadInputFormatException('user not found');
                }
                if (user.subrole == 'superadmin') {
                    throw new exceptions_1.BadInputFormatException('this role cannot be changed');
                }
                if (data.subrole == 'head of department') {
                    if ((user === null || user === void 0 ? void 0 : user.subrole) !== 'head of department') {
                        let hod = yield this.user.findOne({ role: user === null || user === void 0 ? void 0 : user.role, subrole: 'head of department' });
                        if (!hod) {
                            updatedUser = yield this.user.findByIdAndUpdate(user === null || user === void 0 ? void 0 : user._id, {
                                $set: data
                            }, { new: true });
                            return Promise.resolve(updatedUser);
                        }
                        else {
                            throw new exceptions_1.BadInputFormatException('this department already has a head');
                        }
                    }
                }
                else {
                    updatedUser = yield this.user.findByIdAndUpdate(user === null || user === void 0 ? void 0 : user._id, {
                        $set: { role: data.role, subrole: data.subrole }
                    }, { new: true });
                    yield logs_1.createLog({
                        user: user._id,
                        activities: {
                            title: 'Change role',
                            activity: `You changed ${updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.name}\'s role`,
                            time: new Date().toISOString()
                        }
                    });
                    return Promise.resolve(updatedUser);
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    requestPasswordReset(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.user.findOne({ email: data.email });
                if (!user) {
                    throw new exceptions_1.BadInputFormatException('No user exists with this email');
                }
                const payload = {
                    id: user._id,
                    email: user.email
                };
                let expiresIn = 1000 * 60 * 60 * 24;
                const token = jsonwebtoken_1.sign(payload, exports.signTokenKey, { expiresIn });
                const html = yield resolve_template_1.getTemplate('reset-password', {
                    name: user.role,
                    link: `${static_1.default.FRONTEND_URL}/reset-password/${token}`,
                });
                let mailLoad = {
                    content: html,
                    subject: 'Reset Password',
                    email: user.email,
                };
                yield new mail_1.default().sendMail(mailLoad);
                return Promise.resolve({
                    message: 'A reset email has been sent',
                    token
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    resetPassword(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decode = jsonwebtoken_1.verify(data.token, exports.signTokenKey);
                //@ts-ignore
                const user = yield this.user.findOne({ _id: decode.id, email: decode.email }).select('+password');
                const salt = bcryptjs_1.genSaltSync(10);
                let password = yield bcryptjs_1.hash(data.password, salt);
                //@ts-ignore
                yield this.user.findByIdAndUpdate(user._id, { password, isVerified: true }, { new: true });
                yield logs_1.createLog({
                    //@ts-ignore
                    user: user._id,
                    activities: {
                        title: 'change password',
                        activity: `You changed your password`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve({
                    message: 'password reset success'
                });
            }
            catch (e) {
                if (e.name == "TokenExpiredError") {
                    throw new exceptions_1.InvalidAccessCredentialsException('This token has expired');
                }
                if (e.name == "JsonWebTokenError") {
                    throw new exceptions_1.InvalidAccessCredentialsException('Invalid token');
                }
                throw e;
            }
        });
    }
    changePassword(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const findUser = yield this.user.findById(user._id).select('+password');
                const { oldPassword, newPassword } = data;
                //@ts-ignore
                const matchPassword = bcryptjs_1.compareSync(oldPassword, findUser.password);
                if (!matchPassword) {
                    throw new exceptions_1.BadInputFormatException('Old password does not match');
                }
                const salt = bcryptjs_1.genSaltSync(10);
                const password = yield bcryptjs_1.hash(newPassword, salt);
                let updated = yield this.user.findByIdAndUpdate(user._id, { password, isVerified: true }, { new: true });
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Change password',
                        activity: `Password Changed`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(updated);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    suspendUser(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.user.findById(data.userId);
                if (!user) {
                    throw new exceptions_1.BadInputFormatException('user not found');
                }
                let updatedUser = yield this.user.findByIdAndUpdate(user._id, { deactivated: data.suspend }, { new: true });
                //@ts-ignore
                let message = updatedUser.deactivated ? 'suspended' : 're-activated';
                return Promise.resolve({
                    message,
                    user
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchallUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.user.find({});
                return Promise.resolve(users);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.user.findById(id);
                if (!user) {
                    throw new exceptions_1.BadInputFormatException('user not found');
                }
                yield this.user.findByIdAndDelete(id);
                return Promise.resolve({
                    message: 'User deleted'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateToken(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.user.findByIdAndUpdate(userId, { token }, { new: true });
                console.log(user);
                if (!user) {
                    throw new exceptions_1.BadInputFormatException('user not found');
                }
                return Promise.resolve(user);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = User;
//# sourceMappingURL=index.js.map