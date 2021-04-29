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
class CustomerValidation extends ctrl_1.default {
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
    static validateCustomer() {
        const rules = [
            express_validator_1.check('name')
                .exists()
                .withMessage('Customer name is required'),
            express_validator_1.check('customerType')
                .exists()
                .withMessage('Customer Type is required'),
            express_validator_1.check('modeOfService'),
            express_validator_1.check('nickName')
                .exists()
                .withMessage('Customer email is required'),
            express_validator_1.check('address')
                .exists()
                .withMessage('Provide customer address'),
            express_validator_1.check('contactPerson')
                .exists()
                .withMessage('Contact Person is required please provide one'),
            express_validator_1.check('email')
                .exists()
                .withMessage('Provide an email address')
                .isEmail()
                .withMessage('provide a valid email address'),
            express_validator_1.check('TIN'),
            express_validator_1.check('phoneNumber')
                .exists()
                .withMessage('Please Provide phone number'),
            express_validator_1.check('rcNumber'),
            express_validator_1.check('cylinderHoldingTime')
                .exists()
                .withMessage('Please Provide holding time'),
            express_validator_1.check('territory'),
            express_validator_1.check('products')
                .exists()
                .withMessage('Products are required')
                .isArray()
                .withMessage('Products should be an array'),
            express_validator_1.check('unitPrice')
                .exists()
                .withMessage('Provide price'),
            express_validator_1.check('CAC')
                .exists()
                .withMessage('Provide Your CAC certificate'),
            express_validator_1.check('validId')
                .exists()
                .withMessage('Provide a valid ID')
        ];
        return rules;
    }
    static validateOrder() {
        const rules = [
            express_validator_1.check('pickupType'),
            express_validator_1.check('pickupDate'),
            express_validator_1.check('status'),
            express_validator_1.check('numberOfCylinders'),
            express_validator_1.check('vehicle'),
            express_validator_1.check('cylinderSize'),
            express_validator_1.check('gasType'),
            express_validator_1.check('gasColor')
        ];
        return rules;
    }
}
exports.default = CustomerValidation;
//# sourceMappingURL=validator.js.map