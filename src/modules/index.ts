import {
  Person,
  User,
  Cylinder,
  RegisteredCylinder,
  TransferCyl,
  Product,
  Supplier,
  Inventory,
  DisburseProduct,
  Vehicle,
  Driver,
  Customer,
  Order,
  Complain
} from '../models/index';
import PersonModule from './person';
import UserModule from './user';
import CylinderModule from './cylinder';
import ProductModule from './inventory';
import { inventorySchema } from '../models/receivedProduct';
import VehicleModule from './vehicle';
import DriverModule from './driver';
import CustomerModule from './customers';

/**
 * @category Modules
 * @param {person} Instance of Person module
 */
export const person = new PersonModule({
  model: Person
});

export const user = new UserModule({
  model: User
});

export const cylinder = new CylinderModule({
  cylinder:Cylinder,
  registerCylinder:RegisteredCylinder,
  transfer:TransferCyl
});

export const product = new ProductModule({
  product:Product,
  supplier:Supplier,
  inventory:Inventory,
  disburse:DisburseProduct
});

export const vehicle = new VehicleModule({
  vehicle:Vehicle
});

export const driver = new DriverModule({
  driver:User
});

export const customer = new CustomerModule({
  customer:Customer,
  order:Order,
  complaint:Complain
});
