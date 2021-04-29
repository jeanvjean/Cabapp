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
exports.InventoryValidator = void 0;
const express_validator_1 = require("express-validator");
const exceptions_1 = require("../../exceptions");
const ctrl_1 = require("../ctrl");
class InventoryValidator extends ctrl_1.default {
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
    static validateProduct() {
        const rules = [
            express_validator_1.check('itemDescription')
                .exists()
                .withMessage('provide item description'),
            express_validator_1.check('equipmentModel')
                .exists()
                .withMessage('equipment Model required'),
            express_validator_1.check('equipmentType'),
            express_validator_1.check('areaOfSpecialization'),
            express_validator_1.check('asnlNumber')
                .exists()
                .withMessage('Provide ASNL number'),
            express_validator_1.check('partNumber')
                .exists()
                .withMessage('Part Number is required'),
            express_validator_1.check('serialNumber')
                .exists()
                .withMessage('provide serial number'),
            express_validator_1.check('quantity')
                .exists()
                .withMessage('quantity is required')
                .isNumeric()
                .withMessage('quantity should be a numeric value'),
            express_validator_1.check('unitCost')
                .exists()
                .withMessage('provide unit cost'),
            express_validator_1.check('totalCost')
                .exists()
                .withMessage('totalCost')
                .isNumeric()
                .withMessage('Total cost should be numeric value'),
            express_validator_1.check('reorderLevel')
                .exists()
                .withMessage('Provice reorder level'),
            express_validator_1.check('location')
                .exists()
                .withMessage('Provide Location'),
            express_validator_1.check('referer'),
            express_validator_1.check('division')
                .exists()
                .withMessage('Provide division'),
            express_validator_1.check('supplier')
        ];
        return rules;
    }
}
exports.InventoryValidator = InventoryValidator;
exports.default = InventoryValidator;
//# sourceMappingURL=validation.js.map