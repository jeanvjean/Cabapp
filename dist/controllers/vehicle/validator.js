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
    static validateInput() {
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
                .withMessage('Acquistion date is required'),
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
    static validateVehicleUpdate() {
        const rules = [
            express_validator_1.check('vehicleType'),
            express_validator_1.check('manufacturer'),
            express_validator_1.check('vModel'),
            express_validator_1.check('regNo'),
            express_validator_1.check('acqisistionDate'),
            express_validator_1.check('mileageDate'),
            express_validator_1.check('currMile'),
            express_validator_1.check('assignedTo'),
            express_validator_1.check('vehCategory'),
            express_validator_1.check('tankCapacity'),
            express_validator_1.check('batteryCapacity'),
            express_validator_1.check('fuelType'),
            express_validator_1.check('grossWeight'),
            express_validator_1.check('netWeight'),
            express_validator_1.check('disposal'),
        ];
        return rules;
    }
    static validateInspection() {
        const rules = [
            express_validator_1.check('type')
                .exists()
                .withMessage('type is required'),
            express_validator_1.check('operation')
                .exists()
                .withMessage('operation is required'),
            express_validator_1.check('cost')
                .optional({ checkFalsy: true })
                .isNumeric()
                .withMessage('Is a numeric value'),
            express_validator_1.check('date'),
            express_validator_1.check('curMileage')
                .exists()
                .withMessage('current Mileage is required'),
            express_validator_1.check('prevMileage')
                .exists()
                .withMessage('prev mileage is required'),
            express_validator_1.check('itemsReplaced')
                .optional({ checkFalsy: true })
                .isArray()
                .withMessage('replaced items should be an array'),
            express_validator_1.check('comment'),
            express_validator_1.check('recomendedMech'),
            express_validator_1.check('referer'),
            express_validator_1.check('analytics')
        ];
        return rules;
    }
    static validateRoutePlan() {
        const rules = [
            express_validator_1.check('activity')
                .exists()
                .withMessage('activity is required'),
            express_validator_1.check('orderType')
                .exists()
                .withMessage('orderType is required'),
            express_validator_1.check('fuelGiven')
                .exists()
                .withMessage('Fuel given is required'),
            express_validator_1.check('customers')
                .optional({ checkFalsy: true })
                .isArray()
                .withMessage('Customers must be an array'),
            express_validator_1.check('suppliers')
                .optional({ checkFalsy: true })
                .isArray()
                .withMessage('suppliers must be an array'),
            express_validator_1.check('territory')
                .exists()
                .withMessage('territory is required'),
            express_validator_1.check('startDate'),
            express_validator_1.check('endDate')
        ];
        return rules;
    }
    static startRoute() {
        const rules = [
            express_validator_1.check('email')
                .isEmail()
                .withMessage('email should be a valid email')
                .exists()
                .withMessage('email is required')
        ];
        return rules;
    }
    static assignDriver() {
        const rules = [
            express_validator_1.check('driver')
                .exists()
                .withMessage('driver is required')
        ];
        return rules;
    }
    static routeCompleted() {
        const rules = [
            express_validator_1.check('status')
                .exists()
                .withMessage('status is required'),
            express_validator_1.check('ecr')
        ];
        return rules;
    }
    static validateDeliveryNote() {
        const rules = [
            express_validator_1.check('customer'),
            express_validator_1.check('supplier'),
            express_validator_1.check('cylinders')
                .exists()
                .withMessage('cylinders are required')
                .isArray()
                .withMessage('cylinders must be an array'),
            express_validator_1.check('invoiceNo')
                .exists()
                .withMessage('pass invoice number'),
            express_validator_1.check('deliveryType')
                .exists()
                .withMessage('delivery types required')
        ];
        return rules;
    }
}
exports.default = VehicleValidator;
//# sourceMappingURL=validator.js.map