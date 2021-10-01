import Ctrl from "../ctrl";
import { RequestHandler, Response, Request, NextFunction } from "express";
import { validationResult, check, ValidationChain } from "express-validator";
import { BadInputFormatException } from "../../exceptions";



class validateAccount extends Ctrl{
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

      static validateInvoice():ValidationChain[]{
          const rules = [
            check('customer')
                .exists()
                .withMessage('Provide customer name'),
            check('totalAmount')
                .exists()
                .withMessage('total amount is required')
                .isNumeric()
                .withMessage('total amount should be numeric'),
            check('amountPaid')
                .exists()
                .withMessage('amount paid is required')
                .isNumeric()
                .withMessage('amount paid should be numeric'),
            check('date')
                .exists()
                .withMessage('provide date'),
            check('amountInWords')
                .exists()
                .withMessage('write the total amount in words'),
            check('recieptType')
                .exists()
                .withMessage('recieptType is required'),
            // check('products')
            // //@ts-ignore
            //     .exists()
            //     .if((value, {req})=> req.body.recieptType == 'product')
            //     .withMessage('products array is required for this reciept type')
            //     .isArray(),
            // check('cylinders')
            // //@ts-ignore
            //     .exists().if((value, {req})=> req.body.recieptType == 'cylinder')
            //     .withMessage('cylinders array is required for this reciept type')
            //     .isArray(),
          ]

          return rules;
      }

      static validateUpdate():ValidationChain[]{
          const rules = [
              check('amountPaid')
                .exists()
                .withMessage('please update the amount paid')
          ]
          return rules;
      }
}

export default validateAccount;