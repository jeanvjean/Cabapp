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
  Complain,
  Branch,
  Archive,
  PickupModel,
  WalkInCustomer,
  SalesReq,
  Production,
  PurchaseOrder,
  OCN,
  Reciept,
  Activity,
  Condemn,
  ChangeCylinder,
  VehicleReport,
  DeletedUsers,
  DeletedCustomers,
  EmptyCylinder,
  Waybill,
  ScanModel,
  TerretoryModel
} from '../models/index';
import PersonModule from './person';
import UserModule from './user';
import CylinderModule from './cylinder';
import ProductModule from './inventory';
import { inventorySchema } from '../models/receivedProduct';
import VehicleModule from './vehicle';
import DriverModule from './driver';
import CustomerModule from './customers';
import SalesModule from './sales';
import ProductionModule from './production';
import PurchaseOrderModule from './purchaseOrder';
import OcnModule from './ocn';
import AccountModule from './account';
import EmptyCylinderModule from "./ecr";
import Scan from './scan';

/**
 * @category Modules
 * @param {person} Instance of Person module
 */
export const person = new PersonModule({
  model: Person
});

export const user = new UserModule({
  user: User,
  deleted:DeletedUsers
});

export const cylinder = new CylinderModule({
  cylinder:Cylinder,
  registerCylinder:RegisteredCylinder,
  transfer:TransferCyl,
  archive:Archive,
  user:User,
  condemn:Condemn,
  change_gas:ChangeCylinder,
  customer:Customer,
  branch:Branch,
  supplier:Supplier,
  ocn:OCN,
  waybill:Waybill
});

export const product = new ProductModule({
  product:Product,
  supplier:Supplier,
  inventory:Inventory,
  disburse:DisburseProduct,
  branch:Branch,
  user:User,
  customer:Customer
});

export const vehicle = new VehicleModule({
  vehicle:Vehicle,
  pickup:PickupModel,
  user:User,
  activity:Activity,
  registerCylinder:RegisteredCylinder,
  branch:Branch,
  routeReport:VehicleReport,
  customer:Customer,
  supplier:Supplier,
  ecr:EmptyCylinder,
  waybill:Waybill,
  ocn:OCN,
  invoice:Reciept,
  terretory:TerretoryModel
});

export const driver = new DriverModule({
  driver:User
});

export const customer = new CustomerModule({
  customer:Customer,
  order:Order,
  complaint:Complain,
  user:User,
  walkin:WalkInCustomer,
  branch:Branch,
  product:Product,
  vehicle:Vehicle,
  supplier:Supplier,
  cylinder:Cylinder,
  deleteCustomer:DeletedCustomers,
  pickup:PickupModel
});

export const sales = new SalesModule({
  sales:SalesReq,
  user:User,
  cylinder:RegisteredCylinder,
  purchase:PurchaseOrder,
  ecr:EmptyCylinder,
  productionSchedule:Production
});

export const production = new ProductionModule ({
  production:Production,
  user:User,
  regCylinder:RegisteredCylinder,
  ecr:EmptyCylinder
});

export const purchase = new PurchaseOrderModule({
  purchase:PurchaseOrder,
  user:User,
  ecr:EmptyCylinder,
  cylinder:RegisteredCylinder
});

export const ocn = new OcnModule({
  ocn:OCN,
  user:User,
  customer:Customer,
  branch:Branch,
  cylinder:RegisteredCylinder,
  delivery:Waybill
});

export const account = new AccountModule({
  account:Reciept,
  salesRequisition:SalesReq,
  deliveryNote:Waybill
});

export const emptyCylinder = new EmptyCylinderModule({
  emptyCylinder:EmptyCylinder,
  user:User,
  cylinder:RegisteredCylinder,
  customer:Customer,
  ocn:OCN,
  branch:Branch
});

export const scan = new Scan({
  scan:ScanModel,
  cylinder:RegisteredCylinder
});
