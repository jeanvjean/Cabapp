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
const express_validator_1 = require("express-validator");
const exceptions_1 = require("../../exceptions");
const ctrl_1 = require("../ctrl");
class SalesValidator extends ctrl_1.default {
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
    static validateSales() {
        const rules = [
            express_validator_1.check('customer')
                .exists()
                .withMessage('please pass customer'),
            express_validator_1.check('ecrNo')
                .exists()
                .withMessage('ERC number is required'),
            express_validator_1.check('cylinders')
                .isArray()
                .withMessage('cylinders should be an array of objects')
        ];
        return rules;
    }
    static validateSalesApproval() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('Status is required'),
            express_validator_1.check('salesId')
                .exists()
                .withMessage('salesId is required'),
            express_validator_1.check('password')
                .exists()
                .withMessage('provide your password for confirmation')
        ];
        return rules;
    }
}
exports.default = SalesValidator;
//# sourceMappingURL=validator.js.map