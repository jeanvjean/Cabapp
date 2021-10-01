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
class validateAccount extends ctrl_1.default {
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
    static validateInvoice() {
        const rules = [
            express_validator_1.check('customer')
                .exists()
                .withMessage('Provide customer name'),
            express_validator_1.check('cylinderType')
                .exists()
                .withMessage('Please provide cylinder type'),
            express_validator_1.check('totalAmount')
                .exists()
                .withMessage('total amount is required')
                .isNumeric()
                .withMessage('total amount should be numeric'),
            express_validator_1.check('amountPaid')
                .exists()
                .withMessage('amount paid is required')
                .isNumeric()
                .withMessage('amount paid should be numeric'),
            express_validator_1.check('date')
                .exists()
                .withMessage('provide date'),
            express_validator_1.check('amountInWords')
                .exists()
                .withMessage('write the total amount in words'),
            express_validator_1.check('products')
                //@ts-ignore
                .exists().if((value, { req }) => req.body.recieptType == 'product')
                .withMessage('products array is required for this reciept type')
        ];
        return rules;
    }
    static validateUpdate() {
        const rules = [
            express_validator_1.check('amountPaid')
                .exists()
                .withMessage('please update the amount paid')
        ];
        return rules;
    }
}
exports.default = validateAccount;
//# sourceMappingURL=validator.js.map