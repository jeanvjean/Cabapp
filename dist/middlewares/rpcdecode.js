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
exports.decodeToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const exceptions_1 = require("../exceptions");
const user_1 = require("../modules/user");
exports.decodeToken = function (token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //@ts-ignore
            const decoded = jsonwebtoken_1.verify(token, user_1.signTokenKey);
            //@ts-ignore
            const user = yield user_1.default.fetchUser(decoded);
            return Promise.resolve(user);
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
};
//# sourceMappingURL=rpcdecode.js.map