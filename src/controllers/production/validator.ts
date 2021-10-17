import { RequestHandler, NextFunction, Request, Response } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import { BadInputFormatException } from "../../exceptions";
import Ctrl from "../ctrl";




class ProductionValidator extends Ctrl{
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
			return next();
    }
  }

  static validateProductionSchedule():ValidationChain[]{
    const rules = [
      check('customer')
        .exists()
        .withMessage('customer is required'),
      check('productionNo')
        .exists()
        .withMessage('production number is required'),
      check('ecrNo')
        .exists()
        .withMessage('provide the ECR number'),
      check('shift')
        .exists()
        .withMessage('provide shift for this production'),
      check('date'),
      check('cylinders')
        .exists()
        .withMessage('Provide list of cylinders for production')
        .isArray()
        .withMessage('cylinders must be an array'),
      check('quantityToFill')
        .exists()
        .withMessage('provide quantity to be filled')
        .isNumeric()
        .withMessage('Quantity to fill is should be numeric value'),
      check('volumeToFill')
        .exists()
        .withMessage('provide Volume to be filled'),
      check('totalQuantity')
        .exists()
        .withMessage('provide total quantity to be filled')
        .isNumeric()
        .withMessage('Total Quantity to fill is should be numeric value'),
      check('totalVolume')
        .exists()
        .withMessage('provide total Volume to be filled')
    ]
    return rules;
  }

  static validateApproval():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('Status is required'),
      check('productionId')
        .exists()
        .withMessage('productionId is required'),
      check('password')
        .exists()
        .withMessage('provide your password for confirmation')
    ]
    return rules;
  }

  static markFullCylinders():ValidationChain[]{
    const rules = [
      check('productionId')
        .exists()
        .withMessage('production id is needed'),
      check('cylinders')
        .exists()
        .withMessage('pass the id of filled cylinders')
    ]
    return rules;
  }
}

export default ProductionValidator;
