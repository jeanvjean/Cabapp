import { Request, Response, RequestHandler, NextFunction } from 'express';
import { check, ValidationChain, validationResult } from 'express-validator';
import { BadInputFormatException } from '../../exceptions';
import Ctrl from '../ctrl';


class EcrValidator extends Ctrl{
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

  static createEcr():ValidationChain[]{
    const rules = [
      check('customer'),
      check('supplier'),
      check('priority'),
      //   .exists()
      //   .withMessage('indicate the priority(1=urgent, 2=regular)'),
      check('cylinders')
        .exists()
        .withMessage('cylinders array is required')
        .isArray()
        .withMessage('cylinders must be an array')
    ]
    return rules;
  }

  static approveEcr(): ValidationChain[]{
    const rules = [
        check('password')
            .exists()
            .withMessage('password is required to proceed'),
        check('status')
            .exists()
            .withMessage('status is required, apprved or rejected'),
        check('ecrId')
            .exists()
            .withMessage('pass the id for the ecr to approve')
    ]
    return rules;
  }

}

export default EcrValidator;
