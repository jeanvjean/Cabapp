/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import Ctrl from '../ctrl';
import {RequestHandler, Request, Response, NextFunction} from 'express';
import {validationResult, ValidationChain, check} from 'express-validator';
import {BadInputFormatException} from '../../exceptions';


class validatePurchaseOrder extends Ctrl {
  validate(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction)=>{
      const result = validationResult(req);
      const hasErrors = !result.isEmpty();
      const errors = result.array();
      if (hasErrors) {
        const error = new BadInputFormatException(
          errors.map((i) => i.msg).join(','),
          errors.map((e) => e.msg)
        );
        return this.handleError(error, req, res);
      }
      return next();
    };
  }

  static validatePurchase(): ValidationChain[] {
    const rules = [
      check('gasType')
        .exists()
        .withMessage('Gas Type is required'),
      check('type')
        .exists()
        .withMessage('purchase order type is required'),
      check('date'),
      check('cylinders')
        .exists()
        .withMessage('Cylinders need to be provided')
        .isArray()
        .withMessage('cylinders must be an array of cylinders'),
      check('comment')
    ];
    return rules;
  }

  static approvePurchaseOrder(): ValidationChain[] {
    const rules = [
      check('status')
        .exists()
        .withMessage('status approved/rejected is required'),
      check('password')
        .exists()
        .withMessage('passeord is required'),
      check('comment')
    ];
    return rules;
  }
}

export default validatePurchaseOrder;
