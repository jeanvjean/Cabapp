/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import {NextFunction, RequestHandler, Response, Request} from 'express';
import {check, ValidationChain, validationResult} from 'express-validator';
import {BadInputFormatException} from '../../exceptions';
import Ctrl from '../ctrl';


class ScanValidator extends Ctrl {
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
  static validateScan(): ValidationChain[] {
    const rules = [
      check('cylinder')
        .exists()
        .withMessage('cylinder is required'),
      check('formId')
        .optional({checkFalsy: true})
    ];
    return rules;
  }

  static completeScan(): ValidationChain[] {
    const rules = [
      check('formId')
        .exists()
        .withMessage('cylinder is required'),
    ];
    return rules;
  }

  static updateScan(): ValidationChain[] {
    const rules = [
      check('formId')
        .exists()
        .withMessage('cylinder is required'),
      check('cylinders')
        .exists()
        .withMessage('pass cylinders to update scan')
        .isArray()
        .withMessage('cylinders has to be an array')
    ];
    return rules;
  }
}

export default ScanValidator;

