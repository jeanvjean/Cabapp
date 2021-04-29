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
class CylinderValidator extends ctrl_1.default {
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
    static validateCylinder() {
        const rules = [
            express_validator_1.check('gasName')
                .exists()
                .withMessage('gas name is required'),
            express_validator_1.check('colorCode')
                .exists()
                .withMessage('Color code is required')
        ];
        return rules;
    }
    static validateCylinderRegisteration() {
        const rules = [
            express_validator_1.check('cylinderType')
                .exists()
                .withMessage('Cylinder type is required'),
            express_validator_1.check('waterCapacity')
                .exists()
                .withMessage('Water capacity is required'),
            express_validator_1.check('dateManufactured')
                .exists()
                .withMessage('Manufacture Date is required'),
            express_validator_1.check('assignedTo')
                .exists()
                .withMessage('Assigned to is required'),
            express_validator_1.check('gasType')
                .exists()
                .withMessage('Gas type is required'),
            express_validator_1.check('standardColor')
                .exists()
                .withMessage('Color standard is required'),
            express_validator_1.check('assignedNumber'),
            express_validator_1.check('testingPresure')
                .exists()
                .withMessage('Testing Presure is required'),
            express_validator_1.check('fillingPreasure')
                .exists()
                .withMessage('Filling Preasure is required'),
            express_validator_1.check('gasVolumeContent')
                .exists()
                .withMessage('Gas Volume Content required'),
            express_validator_1.check('cylinderNumber')
        ];
        return rules;
    }
    static validateCylinderTransfer() {
        const rules = [
            express_validator_1.check('cylinders')
                .exists()
                .withMessage('provide cylinder(s) to transfer')
                .isArray(),
            express_validator_1.check('to')
                .exists()
                .withMessage('we need a user to transfer the cylinder to'),
            express_validator_1.check('type')
                .exists()
                .withMessage('type of transfer (Permanent/Temporary)'),
            express_validator_1.check('comment'),
            express_validator_1.check('nextApprovalOfficer')
                .exists()
                .withMessage('Please indicate the next officer to approve this transfer')
        ];
        return rules;
    }
}
exports.default = CylinderValidator;
//# sourceMappingURL=validator.js.map