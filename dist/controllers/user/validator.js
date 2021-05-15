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
const ctrl_1 = require("../ctrl");
const express_validator_1 = require("express-validator");
const exceptions_1 = require("../../exceptions");
class UserValidator extends ctrl_1.default {
    validate() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const result = express_validator_1.validationResult(req);
            const hasErrors = !result.isEmpty();
            const errors = result.array();
            if (hasErrors) {
                const error = new exceptions_1.BadInputFormatException(errors.map((i) => i.msg).join(','), errors.map((e) => e.msg));
                return this.handleError(error, req, res);
            }
            return next();
        });
    }
    static validateUser() {
        const rules = [
            express_validator_1.check('name')
                .exists({ checkFalsy: true })
                .withMessage('Name needs to be provided'),
            express_validator_1.check('email')
                .exists({ checkFalsy: true })
                .withMessage('Email is required')
                .isEmail()
                .withMessage('e mail must be a valid email address'),
            express_validator_1.check('password')
                .exists({ checkFalsy: true })
                .withMessage('Password is required')
                .isLength({ min: 6 })
                .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
                .withMessage('Password must be at least six(6) character long and most contain at least 1 letter, 1 number and 1 special character'),
            express_validator_1.check('role')
                .exists()
                .withMessage('Role is required'),
            express_validator_1.check('phoneNumber')
                .matches(/^(\+\d{2,3})(?:\d\s?){9,10}$/)
                .withMessage('Phone number must contain international code as well as 9 or 10 digits!')
        ];
        return rules;
    }
    static validateLogin() {
        const rules = [
            express_validator_1.check('email')
                .exists({ checkFalsy: true })
                .withMessage('Email is required')
                .isEmail()
                .withMessage('pease provide a valid email'),
            express_validator_1.check('password')
                .exists({ checkFalsy: true })
                .withMessage('enter password')
        ];
        return rules;
    }
    static validatePasswordChange() {
        const rules = [
            express_validator_1.check('oldPassword')
                .exists()
                .withMessage('Provide your old password'),
            express_validator_1.check('newPassword')
                .exists()
                .withMessage('Provide your new password')
                .isLength({ min: 6 })
                .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
                .withMessage('Password must be at least six(6) character long and most contain at least 1 letter, 1 number and 1 special character'),
        ];
        return rules;
    }
    static validatePassword() {
        const rules = [
            express_validator_1.check('password')
                .exists()
                .withMessage('Provide your old password')
                .isLength({ min: 6 })
                .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
                .withMessage('Password must be at least six(6) character long and most contain at least 1 letter, 1 number and 1 special character'),
            express_validator_1.check('token')
                .exists()
                .withMessage('invalid token')
        ];
        return rules;
    }
    static validateInvite() {
        const rules = [
            express_validator_1.check('users')
                .isArray()
                .withMessage('provide an array of user objects to be added with (email, role, and subrole)')
        ];
        return rules;
    }
    static validateUserUpdate() {
        const rules = [
            express_validator_1.check('name'),
            express_validator_1.check('email'),
            express_validator_1.check('phoneNumber')
                .matches(/^(\+\d{2,3})(?:\d\s?){9,10}$/)
                .withMessage('Phone number must contain international code as well as 9 or 10 digits!'),
            express_validator_1.check('gender')
                .exists()
                .withMessage('provide gender please'),
            express_validator_1.check('location')
                .exists()
                .withMessage('provide location')
        ];
        return rules;
    }
}
exports.default = UserValidator;
//# sourceMappingURL=validator.js.map