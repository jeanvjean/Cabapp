import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ValidationChain, validationResult, check } from 'express-validator';
import { widthElements } from 'juice';
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

  validateInput():ValidationChain[]{
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
        .withMessage('Acquistion date is required')
        .toDate()
        .withMessage('Acquisition date must be a date type'),
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

}

export default VehicleValidator;
