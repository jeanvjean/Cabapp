import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ValidationChain, validationResult, check } from 'express-validator';
import BadInputFormatException from '../../exceptions/bad-input-format-exception';
import Ctrl from '../ctrl';



class VehicleValidator extends Ctrl{
  validate():RequestHandler{
    return async(req:Request, res:Response, next:NextFunction)=>{
      const result = validationResult(req);
      const hasErrors = !result.isEmpty();
      const errors = result.array();
      if (hasErrors) {
				const error = new BadInputFormatException(
					errors.map((i) => i.msg).join(','),
					errors.map((e) => e.msg)
				)
				return this.handleError(error, req, res);
			}
			return next()
    }
  }

  static validateInput():ValidationChain[]{
    const rules = [
      check('vehicleType')
        .exists()
        .withMessage('Vehicle Type is required'),
      check('manufacturer')
        .exists()
        .withMessage('Provide vehicle manufacturer'),
      check('vModel')
        .exists()
        .withMessage('provide model'),
      check('regNo')
        .exists()
        .withMessage('Registeration Number is required'),
      check('acqisistionDate')
        .exists()
        .withMessage('Acquistion date is required'),
      check('mileageDate'),
      check('currMile'),
      check('assignedTo'),
      check('vehCategory')
        .exists()
        .withMessage('vehicle category is required'),
      check('tankCapacity')
        .exists()
        .withMessage('tank capacity is required'),
      check('batteryCapacity')
        .exists()
        .withMessage('Battery type is required'),
      check('fuelType')
        .exists()
        .withMessage('Enter fuel type'),
      check('grossWeight'),
      check('netWeight'),
      check('disposal'),
    ]
    return rules;
  }

  static validateVehicleUpdate():ValidationChain[]{
    const rules = [
      check('vehicleType'),
      check('manufacturer'),
      check('vModel'),
      check('regNo'),
      check('acqisistionDate'),
      check('mileageDate'),
      check('currMile'),
      check('assignedTo'),
      check('vehCategory'),
      check('tankCapacity'),
      check('batteryCapacity'),
      check('fuelType'),
      check('grossWeight'),
      check('netWeight'),
      check('disposal'),
    ]
    return rules;
  }

  static validateInspection():ValidationChain[]{
    const rules = [
      check('type')
        .exists()
        .withMessage('type is required'),
      check('operation')
        .exists()
        .withMessage('operation is required'),
      check('cost')
        .optional({checkFalsy:true})
        .isNumeric()
        .withMessage('Is a numeric value'),
      check('date'),
      check('curMileage')
        .exists()
        .withMessage('current Mileage is required'),
      check('prevMileage')
        .exists()
        .withMessage('prev mileage is required'),
      check('itemsReplaced')
        .optional({checkFalsy:true})
        .isArray()
        .withMessage('replaced items should be an array'),
      check('comment'),
      check('recomendedMech'),
      check('referer'),
      check('analytics')
    ]
    return rules;
  }

  static validateRoutePlan():ValidationChain[]{
    const rules = [
      check('activity')
        .exists()
        .withMessage('activity is required'),
      check('orderType')
        .exists()
        .withMessage('orderType is required'),
      check('fuelGiven')
        .exists()
        .withMessage('Fuel given is required'),
      check('customers')
        .optional({checkFalsy:true})
        .isArray()
        .withMessage('Customers must be an array'),
      check('suppliers')
        .optional({checkFalsy:true})
        .isArray()
        .withMessage('suppliers must be an array'),
      check('territory')
        .exists()
        .withMessage('territory is required'),
      check('startDate'),
      check('endDate')
    ]
    return rules
  }

  static startRoute():ValidationChain[]{
    const rules = [
      check('email')
        .isEmail()
        .withMessage('email should be a valid email')
        .exists()
        .withMessage('email is required')
    ]
    return rules;
  }

  static assignDriver():ValidationChain[]{
    const rules = [
      check('driver')
        .exists()
        .withMessage('driver is required')
    ]
    return rules;
  }

  static routeCompleted():ValidationChain[]{
    const rules = [
      check('status')
        .exists()
        .withMessage('status is required'),
      check('ecr')
    ]
    return rules;
  }

  static validateDeliveryNote():ValidationChain[]{
    const rules = [
      check('customer'),
      check('supplier'),
      check('cylinders')
        .exists()
        .withMessage('cylinders are required')
        .isArray()
        .withMessage('cylinders must be an array'),
      check('invoiceNo')
        .exists()
        .withMessage('pass invoice number'),
      check('deliveryType')
        .exists()
        .withMessage('delivery types required')
    ]
    return rules;
  }

}

export default VehicleValidator;
