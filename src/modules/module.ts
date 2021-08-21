import {Error as MongooseError} from 'mongoose';
import {DatabaseException, DatabaseValidationException} from '../exceptions';
import {MongoError} from 'mongodb';

export interface QueryInterface {
  page?: number | 1;
  limit?: number | 10;
  search?: 'string';
  filter?:'string',
  holder?:string,
  cylinderType?:string,
  gasType?:string,
  customer?:string,
  supplier?:string,
  produced?:boolean;
  sort?: object;
  type:string
  branch?:string,
  fromBranch?:string
  range?: string[];
  out?:string
  instock?:string,
  fromDate:string,
  toDate:string,
  verified:boolean
  active:boolean
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
