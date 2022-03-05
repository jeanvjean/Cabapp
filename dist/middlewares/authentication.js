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
const jsonwebtoken_1 = require("jsonwebtoken");
const ctrl_1 = require("../controllers/ctrl");
const exceptions_1 = require("../exceptions");
const user_1 = require("../modules/user");
const index_1 = require("../modules/index");
class Authenticate extends ctrl_1.default {
    verify() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let token = req.get('Authorization');
                if (!token) {
                    throw new exceptions_1.InvalidAccessCredentialsException('Invalid token');
                }
                token = token.split(' ')[0];
                //@ts-ignore
                const decoded = jsonwebtoken_1.verify(token, user_1.signTokenKey);
                const userAccount = yield index_1.user.fetchUserAuth(decoded);
                //@ts-ignore
                req.user = userAccount;
                return next();
            }
            catch (error) {
                if (error.name == "TokenExpiredError") {
                    throw new exceptions_1.InvalidAccessCredentialsException('This token has expired');
                }
                if (error.name == "JsonWebTokenError") {
                    throw new exceptions_1.InvalidAccessCredentialsException('Invalid token');
                }
                this.handleError(error, req, res);
            }
        });
    }
}
exports.default = Authenticate;
//# sourceMappingURL=authentication.js.map