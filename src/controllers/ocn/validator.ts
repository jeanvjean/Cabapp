import Ctrl from "../ctrl";
import { RequestHandler, Response, Request, NextFunction } from "express";
import { BadInputFormatException } from "../../exceptions";
import { validationResult, ValidationChain, check } from "express-validator";




class ocnValidator extends Ctrl{
    validate():RequestHandler{
        return async(req:Request, res:Response, next:NextFunction)=>{
            const result = validationResult(req);
            const hasErrors = !result.isEmpty()
            const errors = result.array()
            if (hasErrors) {
                const error = new BadInputFormatException(
                    errors.map((i) => i.msg).join(','),
                    errors.map((e) => e.msg)
                )
                return this.handleError(error, req, res)
            }
            return next()
        }
    }

    static validateOcn():ValidationChain[]{
        const rules = [
            check('customer'),
            check('supplier'),
            check('cylinderType'),
            check('date')
                .exists()
                .withMessage('provide date please'),
            check('cylinders')
                .isArray()
                .withMessage('cylinders must be an array'),
            check('totalQty')
                .exists()
                .withMessage('provide total quantity')
                .withMessage('Total amount must be a numeric value'),
            check('totalVol')
                .exists()
                .withMessage('total volume is required'),
            check('totalAmount')
                .exists()
                .withMessage('provide total amount')
                .isNumeric()
                .withMessage('Total amount must be a numeric value'),
            check('type')
                .exists()
                .withMessage('please pass ocn type (customer, supplier, or walk-in)')
        ]
        return rules;
    }

    static validateApproval():ValidationChain[]{
        const rules = [
            check('status')
                .exists()
                .withMessage('provide approval status')
        ]
        return rules;
    }

    static validateOcnUpdate():ValidationChain[]{
        const rules = [
            check('customer'),
            check('supplier'),
            check('cylinderType'),
            check('date')
                .exists()
                .withMessage('provide date please'),
            check('cylinders')
                .isArray()
                .withMessage('cylinders must be an array'),
            check('totalQty')
                .isNumeric()
                .withMessage('Total amount must be a numeric value'),
            check('totalVol'),
            check('totalAmount')
                .isNumeric()
                .withMessage('Total amount must be a numeric value'),
            check('type')
                .exists()
                .withMessage('please pass ocn type (customer, supplier, or walk-in)')
        ]
        return rules;
    }
}

export default ocnValidator;