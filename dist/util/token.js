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
exports.passWdCheck = exports.padLeft = exports.generateNumber = exports.generateToken = void 0;
const crypto = require("crypto");
const exceptions_1 = require("../exceptions");
const models_1 = require("../models");
exports.generateToken = (num) => new Promise((resolve, reject) => {
    crypto.randomBytes(num || 16, (err, buffer) => {
        if (err)
            reject(err);
        const token = buffer.toString('hex');
        resolve(token);
    });
});
//@ts-ignore
exports.generateNumber = (n) => {
    var add = 1, max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.
    if (n > max) {
        return exports.generateNumber(max) + exports.generateNumber(n - max);
    }
    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically
    var number = Math.floor(Math.random() * (max - min + 1)) + min;
    return ("" + number).substring(add);
};
exports.padLeft = (nr, n, str) => {
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
};
// const zeroPad = (num, places) => String(num).padStart(places, '0')
// for (let i = 1; i <= n; i++) {
//   console.log("#".repeat(i).padStart(n));
// }
exports.passWdCheck = (user, pwd) => __awaiter(void 0, void 0, void 0, function* () {
    let loginUser = yield models_1.User.findById(user._id).select('+password');
    let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(pwd, user.password));
    if (!matchPWD) {
        throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
    }
    return true;
});
//# sourceMappingURL=token.js.map