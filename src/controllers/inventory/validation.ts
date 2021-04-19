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

}
