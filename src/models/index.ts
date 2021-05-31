import {
  createConnection,
  Connection,
  Model} from 'mongoose';

import MongoConfig from '../configs/mongo';
import cylinderFactory,{ CylinderInterface } from './cylinder';
import personFactory, {PersonInterface} from './person';
import userFactory, { UserInterface } from './user';
import registeredCylinderFactory, { RegisteredCylinderInterface } from './registeredCylinders';
import CylinderTransfer, { TransferCylinder } from './transferCylinder';
import productFactory,{ProductInterface} from './inventory';
import supplierFactory, {SupplierInterface} from './supplier';
import inventoryFactory,{InventoryInterface} from './receivedProduct';
import disburseFactory,{ DisburseProductInterface } from './disburseStock';
import vehicleFactory, {VehicleInterface} from './vehicle';
import driverFactory, {DriverInterface} from './driver';
import customerFactory, {CustomerInterface} from './customer';
import orderFactory, { OrderInterface } from './order';
import complainFactory, { ComplaintInterface } from './complaint';
import branchFactory, { BranchInterface } from './branch';
import archiveFactory, { ArchivedCylinder } from './archiveCylinder';
import driverPickupFactory, { PickupInterface } from './driverPickup';
import walkinCustomerFactory, { WalkinCustomerInterface } from './walk-in-customers';
import salesReqFactory, { SalesRequisitionInterface } from './sales-requisition';
import productionFactory, { ProductionScheduleInterface } from './productionSchedule';
import purchaseFactory, { PurchaseOrderInterface } from './purchaseOrder';
import ocnFactory, { OutgoingCylinderInterface } from './ocn';
import recieptFactory, { RecieptInterface } from './reciept';
import activityLog, { ActivityLogInterface } from './logs';

export const conn: Connection = createConnection(MongoConfig.uri, MongoConfig.options);

export const Person: Model<PersonInterface> = personFactory(conn);

export const User: Model<UserInterface> = userFactory(conn);

export const Cylinder: Model<CylinderInterface> = cylinderFactory(conn);

export const RegisteredCylinder:Model<RegisteredCylinderInterface> = registeredCylinderFactory(conn)

export const TransferCyl: Model<TransferCylinder> = CylinderTransfer(conn);

export const Product: Model<ProductInterface> = productFactory(conn);

export const Supplier:Model<SupplierInterface> = supplierFactory(conn);

export const Inventory:Model<InventoryInterface> = inventoryFactory(conn);

export const DisburseProduct:Model<DisburseProductInterface> = disburseFactory(conn);

export const Vehicle:Model<VehicleInterface> = vehicleFactory(conn);

export const Driver:Model<DriverInterface> = driverFactory(conn);

export const Customer:Model<CustomerInterface> = customerFactory(conn);

export const Order:Model<OrderInterface> = orderFactory(conn);

export const Complain:Model<ComplaintInterface> = complainFactory(conn);

export const Branch:Model<BranchInterface> = branchFactory(conn);

export const Archive:Model<ArchivedCylinder> = archiveFactory(conn);

export const PickupRoutes:Model<PickupInterface> = driverPickupFactory(conn);

export const WalkInCustomer:Model<WalkinCustomerInterface> = walkinCustomerFactory(conn);

export const SalesReq:Model<SalesRequisitionInterface> = salesReqFactory(conn);

export const Production:Model<ProductionScheduleInterface> = productionFactory(conn);

export const PurchaseOrder:Model<PurchaseOrderInterface> = purchaseFactory(conn);

export const OCN:Model<OutgoingCylinderInterface> = ocnFactory(conn);

export const Reciept:Model<RecieptInterface> = recieptFactory(conn);

export const Activity:Model<ActivityLogInterface> = activityLog(conn);

conn.once('open', (): void => console.log('db connection open'));
