import { Request, Response, NextFunction, RequestHandler } from 'express';
import { check, ValidationChain, validationResult } from 'express-validator';
import { BadInputFormatException } from '../../exceptions';
import Ctrl from '../ctrl';


class CustomerValidation extends Ctrl{
  validate():RequestHandler{
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

  static validateCustomer():ValidationChain[]{
    const rules = [
      check('name')
        .exists()
        .withMessage('Customer name is required'),
      check('customerType')
        .exists()
        .withMessage('Customer Type is required'),
      check('modeOfService'),
      check('nickName')
        .exists()
        .withMessage('Customer email is required'),
      check('address')
        .exists()
        .withMessage('Provide customer address'),
      check('contactPerson')
        .exists()
        .withMessage('Contact Person is required please provide one'),
      check('email')
        .exists()
        .withMessage('Provide an email address')
        .isEmail()
        .withMessage('provide a valid email address'),
      check('TIN'),
      check('phoneNumber')
        .exists()
        .withMessage('Please Provide phone number'),
      check('rcNumber'),
      check('cylinderHoldingTime')
        .exists()
        .withMessage('Please Provide holding time'),
      check('territory'),
      check('products')
        .exists()
        .withMessage('Products are required')
        .isArray()
        .withMessage('Products should be an array'),
      check('unitPrice')
        .exists()
        .withMessage('Provide price'),
      check('CAC')
        .exists()
        .withMessage('Provide Your CAC certificate'),
      check('validId')
        .exists()
        .withMessage('Provide a valid ID')
    ]
    return rules;
  }
}

export default CustomerValidation;
