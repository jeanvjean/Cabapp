import { NextFunction, RequestHandler, Response, Request } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import { BadInputFormatException } from "../../exceptions";
import Ctrl from "../ctrl";




class SalesValidator extends Ctrl{
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

  static validateSales():ValidationChain[]{
    const rules = [
      check('customer')
        .exists()
        .withMessage('please pass customer'),
      check('ecrNo')
        .exists()
        .withMessage('ERC number is required'),
      check('cylinders')
        .isArray()
        .withMessage('cylinders should be an array of objects')
    ]
    return rules;
  }

  static validateSalesApproval():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('Status is required'),
      check('salesId')
        .exists()
        .withMessage('salesId is required'),
      check('password')
        .exists()
        .withMessage('provide your password for confirmation')
    ]
    return rules;
  }

}

export default SalesValidator;
