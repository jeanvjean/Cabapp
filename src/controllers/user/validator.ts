import { Request, Response, NextFunction, RequestHandler } from 'express';
import Ctrl from '../ctrl';
import { check,ValidationChain, validationResult  } from 'express-validator';
import { BadInputFormatException } from '../../exceptions';




class UserValidator extends Ctrl {

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

  static validateUser(): ValidationChain[] {
    const rules = [
      check('name')
        .exists({checkFalsy:true})
        .withMessage('Name needs to be provided'),
      check('email')
        .exists({checkFalsy:true})
        .withMessage('Email is required')
        .isEmail()
        .withMessage('e mail must be a valid email address'),
      check('password')
        .exists({checkFalsy:true})
        .withMessage('Password is required')
        .isLength({min:6})
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
        .withMessage('Password must be at least six(6) character long and most contain at least 1 letter, 1 number and 1 special character'),
      check('role')
        .exists()
        .withMessage('Role is required')
    ]

    return rules
  }

  static validateLogin():ValidationChain[]{
    const rules = [
      check('email')
        .exists({checkFalsy:true})
        .withMessage('Email is required')
        .isEmail()
        .withMessage('pease provide a valid email'),
      check('password')
        .exists({checkFalsy:true})
        .withMessage('enter password')
    ]
    return rules;
  }

  static validatePasswordChange():ValidationChain[]{
    const rules=[
      check('oldPassword')
        .exists()
        .withMessage('Provide your old password'),
      check('newPassword')
        .exists()
        .withMessage('Provide your new password')
        .isLength({min:6})
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
        .withMessage('Password must be at least six(6) character long and most contain at least 1 letter, 1 number and 1 special character'),
    ]
    return rules;
  }

  static validatePassword():ValidationChain[]{
    const rules=[
      check('password')
        .exists()
        .withMessage('Provide your old password')
        .isLength({min:6})
        .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
        .withMessage('Password must be at least six(6) character long and most contain at least 1 letter, 1 number and 1 special character'),
      check('token')
        .exists()
        .withMessage('invalid token')
    ]
    return rules;
  }

}

export default UserValidator;
