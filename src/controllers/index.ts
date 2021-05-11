import {customer, cylinder, driver, person, product, user, vehicle, sales} from '../modules';
import CylinderCtrl from './cylinder';
import Ctrl from "./ctrl";
import PersonCtrl from './person';
import UserCtrl from './user';
import ProductCtrl from './inventory';
import VehicleCtrl from './vehicle';
import DriverCtrl from './driver';
import CustomerCtrl from './customer';
import SalesCtrl from './sales';

export const personCtrl = new PersonCtrl(person);
export const userCtrl = new UserCtrl(user);
export const cylinderCtrl = new CylinderCtrl(cylinder);
export const productCtrl = new ProductCtrl(product);
export const vehicleCtrl = new VehicleCtrl(vehicle);
export const driverCtrl = new DriverCtrl(driver);
export const customerCtrl = new CustomerCtrl(customer);
export const salesCtrl = new SalesCtrl(sales)
export const ctrl = new Ctrl();

