import { Request, Response, RequestHandler, NextFunction } from 'express';
import { body, check, ValidationChain, validationResult } from 'express-validator';
import { values } from 'lodash';
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
      check('holdingTime'),
      check('purchaseCost')
        .exists()
        .withMessage('pass purchase cost object')
    ]
    return rules;
  }

  static updateCylinder():ValidationChain[]{
    const rules = [
      check('cylinderType'),
      check('waterCapacity'),
      check('dateManufactured'),
      check('assignedTo'),
      check('gasType'),
      check('standardColor'),
      check('assignedNumber'),
      check('testingPresure'),
      check('fillingPreasure'),
      check('gasVolumeContent'),
      check('cylinderNumber'),
      check('holdingTime'),
      check('purchaseCost')
    ]
    return rules;
  }

  static validateCylinderTransfer():ValidationChain[]{
    const rules = [
      check('cylinders')
        .exists()
        .withMessage('provide cylinder(s) to transfer')
        .isArray(),
      check('type')
        .exists()
        .withMessage('type of transfer (Permanent/Temporary)'),
      check('comment')
    ]
    return rules;
  }

  static validateCylinderCondemnation():ValidationChain[]{
    const rules = [
      check('cylinders')
        .exists()
        .withMessage('provide cylinder(s) to condemn')
        .isArray()
        .withMessage('Cylinders must be an array'),
      check('comment')
    ]
    return rules;
  }

  static validateGasChange():ValidationChain[]{
    const rules = [
      check('cylinders')
        .exists()
        .withMessage('cylinders are required')
        .isArray()
        .withMessage('cylinders must be an array'),
      check('comment')
        .exists()
        .withMessage('comment is required'),
      check('gasType')
        .exists()
        .withMessage('gas type is required for the change'),
      check('cylinderType')
        .exists()
        .withMessage('cylinderType is required')
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
