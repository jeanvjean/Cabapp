/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import Ctrl from '../ctrl';
import {RequestHandler, Response, Request, NextFunction} from 'express';
import {BadInputFormatException} from '../../exceptions';
import {validationResult, ValidationChain, check} from 'express-validator';
import {values} from 'lodash';


class ocnValidator extends Ctrl {
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

  static validateOcn(): ValidationChain[] {
    const rules = [
      check('customer')
        .optional({checkFalsy: true}),
      check('supplier')
        .optional({checkFalsy: true}),
      check('cylinderType')
        .optional({checkFalsy: true}),
      check('date')
        .exists()
        .withMessage('provide date please'),
      check('cylinders')
        .optional({checkFalsy: true})
        .isArray()
        .withMessage('cylinders must be an array'),
      check('totalQty')
        .exists()
        .withMessage('provide total quantity'),
      check('totalVol')
        .exists()
        .withMessage('total volume is required'),
      check('totalAmount')
        .exists()
        .withMessage('provide total amount'),
      check('type')
        .exists()
        .withMessage('please pass cn type (customer, supplier, or walk-in)')
    ];
    return rules;
  }

  static validateApproval(): ValidationChain[] {
    const rules = [
      check('status')
        .exists()
        .withMessage('provide approval status')
    ];
    return rules;
  }

  static validateOcnUpdate(): ValidationChain[] {
    const rules = [
      check('customer')
        .optional({checkFalsy: true}),
      check('supplier')
        .optional({checkFalsy: true}),
      check('cylinderType')
        .optional({checkFalsy: true}),
      check('date')
        .optional({checkFalsy: true}),
      check('cylinders')
        .optional({checkFalsy: true})
        .isArray()
        .withMessage('cylinders must be an array'),
      check('totalQty')
        .optional({checkFalsy: true})
        .isNumeric()
        .withMessage('Total amount must be a numeric value'),
      check('totalVol')
        .optional({checkFalsy: true}),
      check('totalAmount')
        .optional({checkFalsy: true})
        .isNumeric()
        .withMessage('Total amount must be a numeric value'),
      check('type')
    ];
    return rules;
  }
}

export default ocnValidator;
