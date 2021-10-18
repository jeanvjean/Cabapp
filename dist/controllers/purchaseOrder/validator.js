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
class validatePurchaseOrder extends ctrl_1.default {
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
    static validatePurchase() {
        const rules = [
            express_validator_1.check('gasType')
                .exists()
                .withMessage('Gas Type is required'),
            express_validator_1.check('type')
                .exists()
                .withMessage('purchase order type is required'),
            express_validator_1.check('date'),
            express_validator_1.check('cylinders')
                .exists()
                .withMessage('Cylinders need to be provided')
                .isArray()
                .withMessage('cylinders must be an array of cylinders'),
            express_validator_1.check('comment')
        ];
        return rules;
    }
    static approvePurchaseOrder() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('status approved/rejected is required'),
            express_validator_1.check('password')
                .exists()
                .withMessage('passeord is required'),
            express_validator_1.check('productionId')
                .exists()
                .withMessage('Production id is required'),
            express_validator_1.check('comment')
        ];
        return rules;
    }
}
exports.default = validatePurchaseOrder;
//# sourceMappingURL=validator.js.map