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
class EcrValidator extends ctrl_1.default {
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
    static createEcr() {
        const rules = [
            express_validator_1.check('customer'),
            express_validator_1.check('supplier'),
            express_validator_1.check('priority'),
            //   .exists()
            //   .withMessage('indicate the priority(1=urgent, 2=regular)'),
            express_validator_1.check('cylinders')
                .exists()
                .withMessage('cylinders array is required')
                .isArray()
                .withMessage('cylinders must be an array')
        ];
        return rules;
    }
    static approveEcr() {
        const rules = [
            express_validator_1.check('password')
                .exists()
                .withMessage('password is required to proceed'),
            express_validator_1.check('status')
                .exists()
                .withMessage('status is required, apprved or rejected'),
            express_validator_1.check('ecrId')
                .exists()
                .withMessage('pass the id for the ecr to approve')
        ];
        return rules;
    }
}
exports.default = EcrValidator;
//# sourceMappingURL=validator.js.map