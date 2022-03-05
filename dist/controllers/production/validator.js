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
class ProductionValidator extends ctrl_1.default {
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
    static validateProductionSchedule() {
        const rules = [
            express_validator_1.check('customer')
                .exists()
                .withMessage('customer is required'),
            express_validator_1.check('productionNo'),
            express_validator_1.check('ecrNo')
                .exists()
                .withMessage('provide the ECR number'),
            express_validator_1.check('shift')
                .exists()
                .withMessage('provide shift for this production'),
            express_validator_1.check('date'),
            express_validator_1.check('cylinders')
                .exists()
                .withMessage('Provide list of cylinders for production')
                .isArray()
                .withMessage('cylinders must be an array'),
            express_validator_1.check('quantityToFill')
                .exists()
                .withMessage('provide quantity to be filled')
                .isNumeric()
                .withMessage('Quantity to fill is should be numeric value'),
            express_validator_1.check('volumeToFill')
                .exists()
                .withMessage('provide Volume to be filled'),
            express_validator_1.check('totalQuantity')
                .exists()
                .withMessage('provide total quantity to be filled')
                .isNumeric()
                .withMessage('Total Quantity to fill is should be numeric value'),
            express_validator_1.check('totalVolume')
                .exists()
                .withMessage('provide total Volume to be filled')
        ];
        return rules;
    }
    static validateApproval() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('Status is required'),
            express_validator_1.check('productionId')
                .exists()
                .withMessage('productionId is required'),
            express_validator_1.check('password')
                .exists()
                .withMessage('provide your password for confirmation')
        ];
        return rules;
    }
    static markFullCylinders() {
        const rules = [
            express_validator_1.check('productionId')
                .exists()
                .withMessage('production id is needed'),
            express_validator_1.check('cylinders')
                .exists()
                .withMessage('pass the id of filled cylinders')
        ];
        return rules;
    }
    static cylindersStatusChange() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('status is needed'),
            express_validator_1.check('cylinder_ids')
                .exists()
                .withMessage('pass the _id of cylinders')
                .isArray()
                .withMessage('cylinder_ids must be an array')
        ];
        return rules;
    }
}
exports.default = ProductionValidator;
//# sourceMappingURL=validator.js.map