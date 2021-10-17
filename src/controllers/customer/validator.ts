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
      check('products'),
      check('unitPrice'),
      check('CAC'),
      check('validId')
    ]
    return rules;
  }

  static validateOrder():ValidationChain[]{
    const rules = [
      check('pickupType'),
      check('pickupDate'),
      check('status'),
      check('numberOfCylinders'),
      check('vehicle'),
      check('cylinderSize'),
      check('gasType'),
      check('gasColor')
    ]
    return rules;
  }

  static validateValkinCustomer():ValidationChain[]{
    const rules = [
      check('customerName')
        .exists()
        .withMessage('customer name is required'),
      check('ercNo')
        .exists()
        .withMessage('ECR nuber is required'),
      check('orderType')
        .exists()
        .withMessage('please indicate order type'),
      check('date')
        .exists()
        .withMessage('provide order date'),
      check('icnNo')
        .exists()
        .withMessage('provide icn number'),
      check('modeOfService'),
      check('cylinderNo')
        .exists()
        .withMessage('enter cylinder number'),
      check('cylinderSize')
        .exists()
        .withMessage('enter cylinder size'),
      check('totalVolume'),
      check('totalQuantity')
    ]
    return rules;
  }

  static makeComplaint():ValidationChain[]{
    const rules = [
      // check('icnNo')
      //   .exists()
      //   .withMessage('icn Number for order is required to make a complaint'),
      // check('ecrNo')
      //   .exists()
      //   .withMessage('please provide an ecr No to proceed'),
      check('complaintType')
        .exists()
        .withMessage('please provide complaint type'),
      check('complaint')
        .exists()
        .withMessage('complaint is required'),
      check('customer')
        .exists()
        .withMessage('please pass the customer for this complaint')
    ]
    return rules;
  }

  static approveComplaint():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('Pass status approved/rejected'),
      check('id')
        .exists()
        .withMessage('complaind id is required'),
      check('password')
        .exists()
        .withMessage('users password is needed to authorize'),
      check('comment')
    ]
    return rules;
  }

  static markOrder():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('please provide complaint type'),
    ]
    return rules;
  }
}

export default CustomerValidation;
