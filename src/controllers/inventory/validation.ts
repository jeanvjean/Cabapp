import { Request, Response, RequestHandler, NextFunction } from 'express';
import { check, ValidationChain, validationResult } from 'express-validator';
import { BadInputFormatException } from '../../exceptions';
import Ctrl from '../ctrl';


export class InventoryValidator extends Ctrl{
  validate(): RequestHandler {
    return async(req:Request, res:Response, next:NextFunction):Promise<void>=> {
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

  static validateProduct():ValidationChain[]{
    const rules = [
      check('itemDescription')
        .exists()
        .withMessage('provide item description'),
      check('equipmentModel')
        .exists()
        .withMessage('equipment Model required'),
      check('equipmentType'),
      check('areaOfSpecialization'),
      check('asnlNumber')
        .exists()
        .withMessage('Provide ASNL number'),
      check('partNumber')
        .exists()
        .withMessage('Part Number is required'),
      check('quantity')
        .exists()
        .withMessage('quantity is required')
        .isNumeric()
        .withMessage('quantity should be a numeric value'),
      check('unitCost')
        .exists()
        .withMessage('provide unit cost'),
      check('totalCost')
        .exists()
        .withMessage('totalCost')
        .isNumeric()
        .withMessage('Total cost should be numeric value'),
      check('reorderLevel')
        .exists()
        .withMessage('Provice reorder level'),
      check('location')
        .exists()
        .withMessage('Provide Location'),
      check('referer'),
      check('division')
        .exists()
        .withMessage('Provide division'),
      check('supplier')
    ]
    return rules;
  }

}

export default InventoryValidator;
