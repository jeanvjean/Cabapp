import {customer, cylinder, driver, person, product, user, vehicle, sales, production, purchase, ocn, account} from '../modules';
import CylinderCtrl from './cylinder';
import Ctrl from "./ctrl";
import PersonCtrl from './person';
import UserCtrl from './user';
import ProductCtrl from './inventory';
import VehicleCtrl from './vehicle';
import DriverCtrl from './driver';
import CustomerCtrl from './customer';
import SalesCtrl from './sales';
import ProductionCtrl from './production';
import PurchaseOrder from './purchaseOrder';
import OcnController from './ocn';
import AccountCtrl from './account'

export const personCtrl = new PersonCtrl(person);
export const userCtrl = new UserCtrl(user);
export const cylinderCtrl = new CylinderCtrl(cylinder);
export const productCtrl = new ProductCtrl(product);
export const vehicleCtrl = new VehicleCtrl(vehicle);
export const driverCtrl = new DriverCtrl(driver);
export const customerCtrl = new CustomerCtrl(customer);
export const salesCtrl = new SalesCtrl(sales);
export const productionCtrl = new ProductionCtrl(production);
export const purchaseCtrl = new PurchaseOrder(purchase)
export const ocnController = new OcnController(ocn);
export const accountCtrl = new AccountCtrl(account);
export const ctrl = new Ctrl();

