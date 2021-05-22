import { Request, Response, RequestHandler, NextFunction } from 'express';
import { check, ValidationChain, validationResult } from 'express-validator';
import { BadInputFormatException } from '../../exceptions';
import Ctrl from '../ctrl';


class CylinderValidator extends Ctrl{
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

  static validateCylinder():ValidationChain[]{
    const rules = [
      check('gasName')
        .exists()
        .withMessage('gas name is required'),
      check('colorCode')
        .exists()
        .withMessage('Color code is required')
    ]
    return rules;
  }

  static validateCylinderRegisteration():ValidationChain[]{
    const rules = [
      check('cylinderType')
        .exists()
        .withMessage('Cylinder type is required'),
      check('waterCapacity')
        .exists()
        .withMessage('Water capacity is required'),
      check('dateManufactured')
        .exists()
        .withMessage('Manufacture Date is required'),
      check('assignedTo'),
      check('gasType')
        .exists()
        .withMessage('Gas type is required'),
      check('standardColor')
        .exists()
        .withMessage('Color standard is required'),
      check('assignedNumber'),
      check('testingPresure')
        .exists()
        .withMessage('Testing Presure is required'),
      check('fillingPreasure')
        .exists()
        .withMessage('Filling Preasure is required'),
      check('gasVolumeContent')
        .exists()
        .withMessage('Gas Volume Content required'),
      check('cylinderNumber'),
      check('holdingTime')
    ]
    return rules;
  }

  static validateCylinderTransfer():ValidationChain[]{
    const rules = [
      check('cylinders')
        .exists()
        .withMessage('provide cylinder(s) to transfer')
        .isArray(),
      check('to')
        .exists()
        .withMessage('we need a user to transfer the cylinder to'),
      check('type')
        .exists()
        .withMessage('type of transfer (Permanent/Temporary)'),
      check('comment')
    ]
    return rules;
  }

  static validateApproval():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('provide approval status'),
      check('password')
        .exists()
        .withMessage('provide your password'),
      check('comment')
        .exists()
        .withMessage('please make a short comment on this action')
    ]
    return rules;
  }

}

export default CylinderValidator;
