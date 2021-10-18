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
const exceptions_1 = require("../../exceptions");
const express_validator_1 = require("express-validator");
class ocnValidator extends ctrl_1.default {
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
    static validateOcn() {
        const rules = [
            express_validator_1.check('customer')
                .optional({ checkFalsy: true }),
            express_validator_1.check('supplier')
                .optional({ checkFalsy: true }),
            express_validator_1.check('cylinderType')
                .optional({ checkFalsy: true }),
            express_validator_1.check('date')
                .exists()
                .withMessage('provide date please'),
            express_validator_1.check('cylinders')
                .optional({ checkFalsy: true })
                .isArray()
                .withMessage('cylinders must be an array'),
            express_validator_1.check('totalQty')
                .exists()
                .withMessage('provide total quantity')
                .withMessage('Total amount must be a numeric value'),
            express_validator_1.check('totalVol')
                .exists()
                .withMessage('total volume is required'),
            express_validator_1.check('totalAmount')
                .exists()
                .withMessage('provide total amount')
                .isNumeric()
                .withMessage('Total amount must be a numeric value'),
            express_validator_1.check('type')
                .exists()
                .withMessage('please pass cn type (customer, supplier, or walk-in)')
        ];
        return rules;
    }
    static validateApproval() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('provide approval status')
        ];
        return rules;
    }
    static validateOcnUpdate() {
        const rules = [
            express_validator_1.check('customer')
                .optional({ checkFalsy: true }),
            express_validator_1.check('supplier')
                .optional({ checkFalsy: true }),
            express_validator_1.check('cylinderType')
                .optional({ checkFalsy: true }),
            express_validator_1.check('date')
                .optional({ checkFalsy: true }),
            express_validator_1.check('cylinders')
                .optional({ checkFalsy: true })
                .isArray()
                .withMessage('cylinders must be an array'),
            express_validator_1.check('totalQty')
                .optional({ checkFalsy: true })
                .isNumeric()
                .withMessage('Total amount must be a numeric value'),
            express_validator_1.check('totalVol')
                .optional({ checkFalsy: true }),
            express_validator_1.check('totalAmount')
                .optional({ checkFalsy: true })
                .isNumeric()
                .withMessage('Total amount must be a numeric value'),
            express_validator_1.check('type')
        ];
        return rules;
    }
}
exports.default = ocnValidator;
//# sourceMappingURL=validator.js.map