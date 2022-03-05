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
            express_validator_1.check('equipmentModel')
                .exists()
                .withMessage('equipment Model required'),
            express_validator_1.check('equipmentType'),
            express_validator_1.check('asnlNumber')
                .exists()
                .withMessage('Provide ASNL number'),
            express_validator_1.check('partNumber')
                .exists()
                .withMessage('Part Number is required'),
            express_validator_1.check('productName')
                .exists()
                .withMessage('product name is required'),
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
                .withMessage('totalCost'),
            express_validator_1.check('reorderLevel')
                .exists()
                .withMessage('Provice reorder level'),
            express_validator_1.check('location')
                .exists()
                .withMessage('Provide Location'),
            express_validator_1.check('referer'),
            express_validator_1.check('division'),
            express_validator_1.check('supplier')
        ];
        return rules;
    }
    static updateProduct() {
        const rules = [
            express_validator_1.check('equipmentModel'),
            express_validator_1.check('equipmentType'),
            express_validator_1.check('asnlNumber'),
            express_validator_1.check('partNumber'),
            express_validator_1.check('productName')
                .exists()
                .withMessage('product name is required'),
            express_validator_1.check('quantity')
                .isNumeric()
                .withMessage('quantity should be a numeric value'),
            express_validator_1.check('unitCost')
                .isNumeric()
                .withMessage('Total cost should be numeric value'),
            express_validator_1.check('totalCost')
                .isNumeric()
                .withMessage('Total cost should be numeric value'),
            express_validator_1.check('reorderLevel'),
            express_validator_1.check('location'),
            express_validator_1.check('referer'),
            express_validator_1.check('division'),
            express_validator_1.check('supplier')
        ];
        return rules;
    }
    static approveInput() {
        const rules = [
            express_validator_1.check('password')
                .exists()
                .withMessage('provide password for authentication'),
            express_validator_1.check('products')
                .isArray()
                .withMessage('products should be an array'),
            express_validator_1.check('id')
                .exists()
                .withMessage('provide the disbursal id'),
            express_validator_1.check('status')
                .exists()
                .withMessage('provide status approve/reject'),
            express_validator_1.check('comment')
        ];
        return rules;
    }
    static validateUpdateInventory() {
        const rules = [
            express_validator_1.check('products')
                .exists()
                .withMessage('Products are required to be logged'),
            express_validator_1.check('direction')
                .exists()
                .withMessage('Direction is required in-coming/out-going')
        ];
        return rules;
    }
    static createSupplier() {
        const rules = [
            express_validator_1.check('name')
                .exists()
                .withMessage('pass supplier name'),
            express_validator_1.check('productType')
                .exists()
                .withMessage('product type is required'),
            express_validator_1.check('supplierType')
                .exists()
                .withMessage('supplier type is required'),
            express_validator_1.check('email')
                .exists()
                .withMessage('email is required'),
            express_validator_1.check('phoneNumber')
                .exists()
                .withMessage('Phone number is required')
                .matches(/^(\+\d{2,3})(?:\d\s?){9,10}$/)
                .withMessage('Phone number must contain international code as well as 9 or 10 digits!'),
            express_validator_1.check('contactPerson')
                .exists()
                .withMessage('provide a contact person')
        ];
        return rules;
    }
    static updateSupplier() {
        const rules = [
            express_validator_1.check('name')
                .optional({ checkFalsy: true }),
            express_validator_1.check('productType')
                .optional({ checkFalsy: true }),
            express_validator_1.check('supplierType')
                .optional({ checkFalsy: true }),
            express_validator_1.check('email')
                .optional({ checkFalsy: true })
                .isEmail()
                .withMessage('email has to be a valid email'),
            express_validator_1.check('phoneNumber')
                .optional({ checkFalsy: true })
                .matches(/^(\+\d{2,3})(?:\d\s?){9,10}$/)
                .withMessage('Phone number must contain international code as well as 9 or 10 digits!'),
            express_validator_1.check('contactPerson')
                .optional({ checkFalsy: true })
        ];
        return rules;
    }
    static validateProductDisbursal() {
        const rules = [
            express_validator_1.check('products')
                .exists()
                .withMessage('products is reqired')
                .isArray()
                .withMessage('products must be an array'),
            express_validator_1.check('jobTag')
                .exists()
                .withMessage('Job tag is required'),
            express_validator_1.check('mrnDocument')
                .exists()
                .withMessage('please upload an mrn doc.'),
            express_validator_1.check('customer')
                .exists()
                .withMessage('please pass a customer')
        ];
        return rules;
    }
    static createBranch() {
        const rules = [
            express_validator_1.check('name')
                .exists()
                .withMessage('please pass the name of the new Branch'),
            express_validator_1.check('branchAdmin')
                .exists()
                .withMessage('pass branch admin email')
                .isEmail()
                .withMessage('Branch admin has to be an email'),
            express_validator_1.check('location')
                .exists()
                .withMessage('provide location (address')
        ];
        return rules;
    }
    static approveGrn() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('status (approved/rejected) is required'),
            express_validator_1.check('grnId')
                .exists()
                .withMessage('Grn id is required')
        ];
        return rules;
    }
}
exports.InventoryValidator = InventoryValidator;
exports.default = InventoryValidator;
//# sourceMappingURL=validation.js.map