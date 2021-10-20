import { NextFunction, RequestHandler, Response, Request } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import { BadInputFormatException } from "../../exceptions";
import Ctrl from "../ctrl";



class ScanValidator extends Ctrl{
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
    static validateScan():ValidationChain[]{
        const rules = [
            check('cylinder')
                .exists()
                .withMessage('cylinder is required'),
            check('formId')
                .optional({checkFalsy:true})
        ]
        return rules;
    }

    static completeScan():ValidationChain[]{
        const rules = [
            check('formId')
                .exists()
                .withMessage('cylinder is required'),
        ]
        return rules;
    }
}

export default ScanValidator;

