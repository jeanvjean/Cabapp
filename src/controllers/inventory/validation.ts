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

  static validateProduct():ValidationChain[]{
    const rules = [
      check('equipmentModel')
        .exists()
        .withMessage('equipment Model required'),
      check('equipmentType'),
      check('asnlNumber')
        .exists()
        .withMessage('Provide ASNL number'),
      check('partNumber')
        .exists()
        .withMessage('Part Number is required'),
      check('productName')
        .exists()
        .withMessage('product name is required'),
      check('quantity')
        .exists()
        .withMessage('quantity is required')
        .isNumeric()
        .withMessage('quantity should be a numeric value'),
      check('unitCost')
        .exists()
        .withMessage('provide unit cost'),
      check('totalCost')
        .exists()
        .withMessage('totalCost')
        .isNumeric()
        .withMessage('Total cost should be numeric value'),
      check('reorderLevel')
        .exists()
        .withMessage('Provice reorder level'),
      check('location')
        .exists()
        .withMessage('Provide Location'),
      check('referer'),
      check('division'),
      check('supplier')
    ]
    return rules;
  }

  static updateProduct():ValidationChain[]{
    const rules = [
      check('equipmentModel'),
      check('equipmentType'),
      check('asnlNumber'),
      check('partNumber'),
      check('productName')
        .exists()
        .withMessage('product name is required'),
      check('quantity')
        .isNumeric()
        .withMessage('quantity should be a numeric value'),
      check('unitCost')
        .isNumeric()
        .withMessage('Total cost should be numeric value'),
      check('totalCost')
        .isNumeric()
        .withMessage('Total cost should be numeric value'),
      check('reorderLevel'),
      check('location'),
      check('referer'),
      check('division'),
      check('supplier')
    ]
    return rules;
  }

  static approveInput():ValidationChain[]{
    const rules = [
      check('password')
        .exists()
        .withMessage('provide password for authentication'),
      check('products')
        .isArray()
        .withMessage('products should be an array'),
      check('id')
        .exists()
        .withMessage('provide the disbursal id'),
      check('status')
        .exists()
        .withMessage('provide status approve/reject'),
      check('comment')
    ]
    return rules;
  }

  static validateUpdateInventory():ValidationChain[]{
    const rules = [
      check('products')
        .exists()
        .withMessage('Products are required to be logged'),
      check('direction')
        .exists()
        .withMessage('Direction is required in-coming/out-going')
    ]
    return rules;
  }

  static createSupplier():ValidationChain[]{
    const rules = [
      check('name')
        .exists()
        .withMessage('pass supplier name'),
      check('productType')
        .exists()
        .withMessage('product type is required'),
      check('supplierType')
        .exists()
        .withMessage('supplier type is required'),
      check('email')
        .exists()
        .withMessage('email is required'),
      check('phoneNumber')
        .exists()
        .withMessage('Phone number is required')
        .matches(/^(\+\d{2,3})(?:\d\s?){9,10}$/)
        .withMessage('Phone number must contain international code as well as 9 or 10 digits!'),
      check('contactPerson')
        .exists()
        .withMessage('provide a contact person')
    ]
    return rules;
  }

  static updateSupplier():ValidationChain[]{
    const rules = [
      check('name'),
      check('productType'),
      check('supplierType'),
      check('email')
        .isEmail()
        .withMessage('email has to be a valid email'),
      check('phoneNumber')
        .matches(/^(\+\d{2,3})(?:\d\s?){9,10}$/)
        .withMessage('Phone number must contain international code as well as 9 or 10 digits!'),
      check('contactPerson')
    ]
    return rules;
  }

  static validateProductDisbursal():ValidationChain[] {
    const rules = [
      check('products')
        .exists()
        .withMessage('products is reqired')
        .isArray()
        .withMessage('products must be an array'),
      check('jobTag')
        .exists()
        .withMessage('Job tag is required'),
      check('mrnDocument')
        .exists()
        .withMessage('please upload an mrn doc.'),
      check('customer')
        .exists()
        .withMessage('please pass a customer')
    ]
    return rules;
  }

  static createBranch():ValidationChain[]{
    const rules = [
      check('name')
        .exists()
        .withMessage('please pass the name of the new Branch'),
      check('branchAdmin')
        .exists()
        .withMessage('pass branch admin email')
        .isEmail()
        .withMessage('Branch admin has to be an email'),
      check('location')
        .exists()
        .withMessage('provide location (address')
    ]
    return rules;
  }

  static approveGrn():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('status (approved/rejected) is required'),
      check('grnId')
        .exists()
        .withMessage('Grn id is required')
    ]
    return rules;
  }

}

export default InventoryValidator;
