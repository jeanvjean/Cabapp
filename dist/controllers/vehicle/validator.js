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
const bad_input_format_exception_1 = require("../../exceptions/bad-input-format-exception");
const ctrl_1 = require("../ctrl");
class VehicleValidator extends ctrl_1.default {
    validate() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const result = express_validator_1.validationResult(req);
            const hasErrors = !result.isEmpty();
            const errors = result.array();
            if (hasErrors) {
                const error = new bad_input_format_exception_1.default(errors.map((i) => i.msg).join(','), errors.map((e) => e.msg));
                return this.handleError(error, req, res);
            }
            return next();
        });
    }
    validateInput() {
        const rules = [
            express_validator_1.check('vehicleType')
                .exists()
                .withMessage('Vehicle Type is required'),
            express_validator_1.check('manufacturer')
                .exists()
                .withMessage('Provide vehicle manufacturer'),
            express_validator_1.check('vModel')
                .exists()
                .withMessage('provide model'),
            express_validator_1.check('regNo')
                .exists()
                .withMessage('Registeration Number is required'),
            express_validator_1.check('acqisistionDate')
                .exists()
                .withMessage('Acquistion date is required')
                .toDate()
                .withMessage('Acquisition date must be a date type'),
            express_validator_1.check('mileageDate'),
            express_validator_1.check('currMile'),
            express_validator_1.check('assignedTo'),
            express_validator_1.check('vehCategory')
                .exists()
                .withMessage('vehicle category is required'),
            express_validator_1.check('tankCapacity')
                .exists()
                .withMessage('tank capacity is required'),
            express_validator_1.check('batteryCapacity')
                .exists()
                .withMessage('Battery type is required'),
            express_validator_1.check('fuelType')
                .exists()
                .withMessage('Enter fuel type'),
            express_validator_1.check('grossWeight'),
            express_validator_1.check('netWeight'),
            express_validator_1.check('disposal'),
        ];
        return rules;
    }
}
exports.default = VehicleValidator;
//# sourceMappingURL=validator.js.map