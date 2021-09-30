import {Error as MongooseError} from 'mongoose';
import {DatabaseException, DatabaseValidationException} from '../exceptions';
import {MongoError} from 'mongodb';

export interface QueryInterface {
  page?: number | 1;
  limit?: number | 10;
  search?: 'string';
  filter?:'string',
  skip?:number | 0
  holder?:string,
  condition?:string
  owner:string
  subrole?:string
  cylinderType?:string,
  cylinderNumber?:string
  assignedNumber?:string
  gasVolume?:string
  waterCapacity:string
  manufactureDate:string
  gasType?:string,
  customer?:string,
  driver?:string
  driverStatus?:string
  salesStatus?:string
  tecr?:string
  tfcr?:string
  supplier?:string,
  produced?:boolean;
  sort?: object;
  type?:string
  branch?:string,
  fromBranch?:string
  range?: string[];
  departments:string[];
  out?:string
  instock?:string,
  fromDate:string,
  toDate:string,
  verified:boolean
  active:boolean
  suspended?:boolean
  unverified?:boolean
  name?:string
  email?:string
  phone?:string
  activity?:string
  pickupType?:string,
  routeStatus?:string
  approvalStatus?:string
  totalCost?:string, 
  partNo?:string, 
  quantity?:string, 
  productName?:string
  complaintStatus?:string
}

/**
 * Base model class
 * @category Modules
 */
class Module {
  /**
   * Handle generic error in modules
   * @param {Error} error
   */
  handleException(error: Error): void {
    if (error instanceof MongooseError.ValidationError) {
      throw new DatabaseValidationException(error.message, 'person', error);
    } else if (error instanceof MongoError) {
      throw new DatabaseException(error.errmsg, error);
    } else {
      throw error;
    }
  }
}

export default Module;
