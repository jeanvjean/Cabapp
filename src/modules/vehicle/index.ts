import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { PickupInterface } from "../../models/driverPickup";
import { BranchInterface } from "../../models/branch";
import { UserInterface } from "../../models/user";
import { Disposal, InspectApproval, Maintainance, maintType, RecordRoute, RouteActivity, RoutePlanStatus, VehicleInterface } from "../../models/vehicle";
import Module, { QueryInterface } from "../module";
import env from '../../configs/static';
import Notify from '../../util/mail';
import { createLog } from "../../util/logs";
import { ActivityLogInterface } from "../../models/logs";
import { orderType, pickupType } from "../../models/order";
import { cylinderHolder, RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { generateToken, padLeft } from "../../util/token";
import * as schedule from 'node-schedule'
import { getTemplate } from '../../util/resolve-template';
import { vehiclePerformance } from "../../models/pickupReport";
import { mongoose } from "../cylinder";
import { CustomerInterface } from "../../models/customer";
import { SupplierInterface } from "../../models/supplier";
import { EcrApproval, EcrType, EmptyCylinderInterface, Priority, ProductionSchedule } from "../../models/emptyCylinder";
import { WayBillInterface } from "../../models/waybill";
import OutGoingCylinder from "../ocn";
import { OutgoingCylinderInterface } from "../../models/ocn";
import { RecieptInterface } from "../../models/reciept";

export { schedule };

interface vehicleProps{
  vehicle:Model<VehicleInterface>
  pickup:Model<PickupInterface>
  user:Model<UserInterface>
  activity:Model<ActivityLogInterface>,
  registerCylinder:Model<RegisteredCylinderInterface>
  branch:Model<BranchInterface>
  routeReport:Model<vehiclePerformance>
  customer:Model<CustomerInterface>
  supplier:Model<SupplierInterface>
  ecr:Model<EmptyCylinderInterface>
  waybill:Model<WayBillInterface>
  ocn:Model<OutgoingCylinderInterface>
  invoice:Model<RecieptInterface>
}

type NewVehicle = {
  vehicleType:VehicleInterface['vehicleType']
  manufacturer:VehicleInterface['manufacturer']
  vModel:VehicleInterface['vModel']
  regNo:VehicleInterface['regNo']
  acqisistionDate:VehicleInterface['acqisistionDate']
  mileageDate?:VehicleInterface['mileageDate']
  currMile?:VehicleInterface['currMile']
  assignedTo?:VehicleInterface['assignedTo']
  vehCategory:VehicleInterface['vehCategory']
  tankCapacity:VehicleInterface['tankCapacity']
  batteryCapacity:VehicleInterface['batteryCapacity']
  fuelType:VehicleInterface['fuelType']
  grossWeight?:VehicleInterface['grossWeight']
  netWeight?:VehicleInterface['netWeight']
  disposal?:VehicleInterface['disposal'],
  licence:VehicleInterface['licence']
  insuranceDate:VehicleInterface['insuranceDate']
  lastMileage?:VehicleInterface['lastMileage']
}

interface UpdateVehicle {
  vehicleType?:VehicleInterface['vehicleType']
  manufacturer?:VehicleInterface['manufacturer']
  vModel?:VehicleInterface['vModel']
  regNo?:VehicleInterface['regNo']
  acqisistionDate?:VehicleInterface['acqisistionDate']
  mileageDate?:VehicleInterface['mileageDate']
  currMile?:VehicleInterface['currMile']
  assignedTo?:VehicleInterface['assignedTo']
  vehCategory?:VehicleInterface['vehCategory']
  tankCapacity?:VehicleInterface['tankCapacity']
  batteryCapacity?:VehicleInterface['batteryCapacity']
  fuelType?:VehicleInterface['fuelType']
  grossWeight?:VehicleInterface['grossWeight']
  netWeight?:VehicleInterface['netWeight']
  disposal?:VehicleInterface['disposal'],
  licence?:VehicleInterface['licence']
  insuranceDate?:VehicleInterface['insuranceDate']
  lastMileage?:VehicleInterface['lastMileage']
  vehicleId:string
}

interface InspectionData {
  type:Maintainance['type']
  operation:Maintainance['operation']
  cost:Maintainance['cost']
  date:Maintainance['date'],
  curMileage:Maintainance['curMileage'],
  prevMileage:Maintainance['prevMileage'],
  itemsReplaced?:Maintainance['itemsReplaced']
  comment?:string
  approvalOfficer?:Maintainance['approvalOfficer']  
  recomendedMech?:string,
  referer?:string
  analytics?:Maintainance['analytics']
}

interface startRouteInput {
  departure?:string,
  email?:string;
  mileIn?:string,
  mileOut?:string
}

interface recordRoutePlanResponse {
  route_plan: PickupInterface,
  failed:any,
  message:string
}

type RouteRecordInput = {
  customers:PickupInterface['customers']
  suppliers:PickupInterface['suppliers']
  startDate:PickupInterface['startDate']
  endDate?:PickupInterface['endDate']
  activity:PickupInterface['activity']
  status:PickupInterface['customer']
  orderType:PickupInterface['orderType']
  modeOfService:PickupInterface['modeOfService']
  date:PickupInterface['date']
  vehicle:PickupInterface['vehicle']
  recievedBy:PickupInterface['recievedBy']
  security:PickupInterface['security']
  deleted:PickupInterface['deleted']
  branch:PickupInterface['branch']
  dateCompleted:PickupInterface['dateCompleted']
  ocnNo:PickupInterface['ocnNo']
  territory:PickupInterface['territory']
  mileageIn:PickupInterface['mileageIn']
  mileageOut:PickupInterface['mileageOut']
  fuelGiven:PickupInterface['fuelGiven']
  fuelsConsumed:PickupInterface['fuelsConsumed']
  timeOut:PickupInterface['timeOut']
  timeIn:PickupInterface['timeIn']
}

interface vehicleSearchInterface {
  search?:string, 
  vehicleName?:string, 
  vehicleType?:string, 
  vehicleNumber?:string, 
  vehicleMake?:string, 
  vehicleModel?:string, 
  lastMileage?:string
  page?: number | 1
  limit?: number | 10;
}

interface newWaybillInterface {
  customer:WayBillInterface['customer']
  cylinders: WayBillInterface['cylinders']
  invoiceNo: WayBillInterface['invoiceNo']
  lpoNo:WayBillInterface['lpoNo']
  deliveryType:WayBillInterface['deliveryType'],
  ocn_id:WayBillInterface['ocn_id']
  invoice_id:WayBillInterface['invoice_id']
}

type Parameters = {
  vehicleId?:string
  routeId?:string
  inspectionId?:string
  comment?:string
  driver?:string
  status?:string,
  query?:QueryInterface,
  mileageOut?:string,
  deliveryNo?:string
  ecrData?:{
    cylinders?:EmptyCylinderInterface['cylinders'],
    fringeCylinders?:EmptyCylinderInterface['fringeCylinders']
    reason?:EmptyCylinderInterface['reason']
  }
}

interface ApproveInspectionData {
  vehicleId:string
  inspectionId:string
  status:string,
  comment:string
}

export type DeleteResponse = {
  message:string
}

class Vehicle extends Module{
  private vehicle:Model<VehicleInterface>
  private pickup:Model<PickupInterface>
  private user:Model<UserInterface>
  private activity:Model<ActivityLogInterface>
  private registerCylinder:Model<RegisteredCylinderInterface>
  private branch:Model<BranchInterface>
  private routeReport:Model<vehiclePerformance>
  private customer:Model<CustomerInterface>
  private supplier:Model<SupplierInterface>
  private ecr:Model<EmptyCylinderInterface>
  private waybill:Model<WayBillInterface>
  private ocn:Model<OutgoingCylinderInterface>
  private invoice:Model<RecieptInterface>

  constructor(props:vehicleProps) {
    super()
    this.vehicle = props.vehicle
    this.pickup = props.pickup;
    this.user = props.user
    this.activity = props.activity
    this.registerCylinder = props.registerCylinder
    this.branch = props.branch
    this.routeReport = props.routeReport
    this.customer = props.customer
    this.supplier = props.supplier
    this.ecr = props.ecr
    this.waybill = props.waybill
    this.ocn = props.ocn
    this.invoice = props.invoice
  }
  public async createVehicle(data:NewVehicle, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.create({...data, branch:user.branch});
      let branch = await this.branch.findById(vehicle.branch).populate([
        {path:'branchAdmin', model:"User"}
      ]);
      await createLog({
        user:user._id,
        activities:{
          title:'create vehicle',
          activity:`You added a vehicle to your vehicle list`,
          time: new Date().toISOString()
        }
      });
      let date = new Date(vehicle.insuranceDate);
      let firstDate = date.setDate(date.getDate() - +14);
      let secondDate = date.setDate(date.getDate() - +7);
      let thirdDate = date.setDate(date.getDate() - +1);
      schedule.scheduleJob(
        new Date(firstDate),
        async function(id:any){
          const html = await getTemplate('licencenotice', {
            date:vehicle.insuranceDate,
            remaining:14,
            registration:vehicle.regNo,
            vehicleType:vehicle.vehicleType,
            model:vehicle.vModel,
            //@ts-ignore
            name:branch.branchAdmin.name
          });
          let payload = {
            content:html,
            subject:'Vehicle licence notification',
            //@ts-ignore
            email:branch.branchAdmin.email
          }
          new Notify().sendMail(payload);
        }.bind(null, vehicle._id)
      );
      schedule.scheduleJob(
        new Date(secondDate),
        async function(id:any){
          const html = await getTemplate('licencenotice', {
            date:vehicle.insuranceDate,
            remaining:7,
            registration:vehicle.regNo,
            vehicleType:vehicle.vehicleType,
            model:vehicle.vModel,
            //@ts-ignore
            name:branch.branchAdmin.name
          });
          let payload = {
            content:html,
            subject:'Vehicle licence notification',
            //@ts-ignore
            email:branch.branchAdmin.email
          }
          new Notify().sendMail(payload);
        }.bind(null, vehicle._id)
      );
      schedule.scheduleJob(
        new Date(thirdDate),
        async function(id:any){
          const html = await getTemplate('licencenotice', {
            date:vehicle.insuranceDate,
            remaining:1,
            registration:vehicle.regNo,
            vehicleType:vehicle.vehicleType,
            model:vehicle.vModel,
            //@ts-ignore
            name:branch.branchAdmin.name
          });
          let payload = {
            content:html,
            subject:'Vehicle licence notification',
            //@ts-ignore
            email:branch.branchAdmin.email
          }
          new Notify().sendMail(payload);
        }.bind(null, vehicle._id)
      )
      return Promise.resolve(vehicle);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async updateVehicle(data:UpdateVehicle, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const { vehicleId } = data;
      let vehicle = await this.vehicle.findById(vehicleId);
      if(!vehicle) {
        throw new BadInputFormatException('vehicle not found');
      }

      let branch = await this.branch.findById(vehicle.branch).populate([
        {path:'branchAdmin', model:"User"}
      ]);

      let updatedVehicle = await this.vehicle.findByIdAndUpdate(vehicle._id, {...data}, {new:true});
      // console.log(updatedVehicle);
      if(data.insuranceDate) {
        let date = new Date(data.insuranceDate);
        let firstDate = date.setDate(date.getDate() - +14);
        let secondDate = date.setDate(date.getDate() - +7);
        let thirdDate = date.setDate(date.getDate() - +1);
      schedule.scheduleJob(
        new Date(firstDate),
        async function(id:any){
          const html = await getTemplate('licencenotice', {
            date:data.insuranceDate,
            remaining:14,
            registration:updatedVehicle?.regNo,
            vehicleType:updatedVehicle?.vehicleType,
            model:updatedVehicle?.vModel,
            //@ts-ignore
            name:branch?.branchAdmin.name
          });
          let payload = {
            content:html,
            subject:'Vehicle licence notification',
            //@ts-ignore
            email:branch?.branchAdmin.email
          }
          new Notify().sendMail(payload);
        }.bind(null, updatedVehicle?._id)
      );
      schedule.scheduleJob(
        new Date(secondDate),
        async function(id:any){
          const html = await getTemplate('licencenotice', {
            date:updatedVehicle?.insuranceDate,
            remaining:7,
            registration:updatedVehicle?.regNo,
            vehicleType:updatedVehicle?.vehicleType,
            model:updatedVehicle?.vModel,
            //@ts-ignore
            name:branch?.branchAdmin.name
          });
          let payload = {
            content:html,
            subject:'Vehicle licence notification',
            //@ts-ignore
            email:branch?.branchAdmin.email
          }
          new Notify().sendMail(payload);
        }.bind(null, updatedVehicle?._id)
      );
      schedule.scheduleJob(
        new Date(thirdDate),
        async function(id:any){
          const html = await getTemplate('licencenotice', {
            date:updatedVehicle?.insuranceDate,
            remaining:1,
            registration:updatedVehicle?.regNo,
            vehicleType:updatedVehicle?.vehicleType,
            model:updatedVehicle?.vModel,
            //@ts-ignore
            name:branch?.branchAdmin.name
          });
          let payload = {
            content:html,
            subject:'Vehicle licence notification',
            //@ts-ignore
            email:branch?.branchAdmin.email
          }
          new Notify().sendMail(payload);
        }.bind(null, updatedVehicle?._id)
      )
      }
      return Promise.resolve(updatedVehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchVehicles(query:vehicleSearchInterface, user:UserInterface):Promise<VehicleInterface[]|undefined> {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, vehicleName, vehicleType, vehicleNumber, vehicleMake, vehicleModel, lastMileage } = query;
      const options = {
        limit:query.limit || 10,
        page:query.page || 1,
        populate:[
          {path:'assignedTo', model:'User'},
          {path:'branch', model:'branches'}
        ]
      }
      let q = {
        branch:user.branch
      }
      let or = [];
      if(vehicleName) {
        or.push({vehicleType: new RegExp(vehicleName, 'gi')});
      }
      if(vehicleType) {
        or.push({vehicleType: new RegExp(vehicleType, 'gi')})
      }
      if(vehicleNumber) {
        or.push({regNo: new RegExp(vehicleNumber, 'gi')})
      }
      if(vehicleMake) {
        or.push({manufacturer: new RegExp(vehicleMake, 'gi')})
      }
      if(vehicleModel) {
        or.push({vModel: new RegExp(vehicleModel, 'gi')})
      }
      if(lastMileage) {
        or.push({lastMileage: new RegExp(lastMileage, 'gi')});
      }
      if(search) {
        or.push({lastMileage: new RegExp(search, 'gi')});
        or.push({vModel: new RegExp(search, 'gi')})
        or.push({manufacturer: new RegExp(search, 'gi')})
        or.push({regNo: new RegExp(search, 'gi')})
        or.push({vehicleType: new RegExp(search, 'gi')})
        or.push({vehicleName: new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      //@ts-ignore
      const vehicles = await this.vehicle.paginate(q, options);
      return Promise.resolve(vehicles);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchVehicle(id:string):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.findById(id).populate([
        {path:'assignedTo', model:'User'},
        {path:'branch', model:'branches'}
      ]);
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async vehicleInspection(id:string, data:InspectionData, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.findById(id);
      let vinspection = {
        type:data.type,
        operation:data.operation,
        date:data.date,
        cost:data.cost,
        curMileage:data.curMileage,
        prevMileage:data.prevMileage,
        itemsReplaced:data.itemsReplaced,
        approvalOfficer:data.approvalOfficer,
        approvalStatus:InspectApproval.PENDING,
        analytics:data.analytics,
        recomendedMech:data.recomendedMech,
        referer:data.referer
      }
      let com = {
        comment:data.comment,
        commentBy:user._id
      }
      //@ts-ignore
      vehicle?.maintainace.push({...vinspection, comments:[com]});
      await vehicle?.save();
      let approvalUser = await this.user.findOne({role:'sales', subrole:'head of department', branch:vehicle?.branch});
      await new Notify().push({
        subject: "Vehicle inspection",
        content: `A vehicle inspection request requires your approval. click to view ${env.FRONTEND_URL}/view-inspection-history/${vehicle?._id}`,
        user: approvalUser
      });
      await createLog({
        user:user._id,
        activities:{
          title:'vehicle Inspection',
          activity:`You created an inspection request`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async viewInspection(data:Parameters):Promise<Maintainance|undefined>{
    try {
      const vehicle = await this.vehicle.findById(data.vehicleId);
      //@ts-ignore
      let inspection = vehicle?.maintainace.filter(inspect=>`${inspect._id}` == `${data.inspectionId}`);
      //@ts-ignore
      return Promise.resolve(inspection[0] as Maintainance);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchInspectionHist(id:string, query:QueryInterface):Promise<any>{
    try {
      const vehicle = await this.vehicle.findById(id);
      let inspection = vehicle?.maintainace;
      let corrective = inspection?.filter(inspect=> inspect.type == maintType.CORRECTIVE);
      let pre_inspection = inspection?.filter(inspect=> inspect.type == maintType.PREINSPECTION);
      let route = vehicle?.routes
      return Promise.resolve({
        inspection,
        pre_inspection,
        corrective,
        vehicleRoute:route,
        message:'inspection history fetched'
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async aprroveInspection(data:ApproveInspectionData, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.findById(data.vehicleId);
      if(!vehicle){
        throw new BadInputFormatException('this vehicle was not found');
      }
      //@ts-ignore
      let inspection = vehicle?.maintainace.filter(inspect=>`${inspect._id}` == `${data.inspectionId}`);
      if(!inspection[0]) {
        throw new BadInputFormatException('maintainance request not found');
      }
      if(data.status == InspectApproval.APPROVED){
        //@ts-ignore
        inspection[0].approvalStatus = InspectApproval.APPROVED
        let com = {
          comment:data.comment,
          commentBy:user._id
        }
        if(data.comment) {
          //@ts-ignore
          inspection[0].comments?.push(com);
        }
      }else if(data.status == InspectApproval.REJECTED){
        //@ts-ignore
        inspection[0].approvalStatus = InspectApproval.REJECTED
        let com = {
          comment:data.comment,
          commentBy:user._id
        }
        if(data.comment) {
          //@ts-ignore
          inspection[0].comments?.push(com);
        }
      }

      await vehicle?.save();
      await createLog({
        user:user._id,
        activities:{
          title:'vehicle Inspection',
          activity:`You ${inspection[0].approvalStatus} an inspection request from ${vehicle.regNo}`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async recordRoute(
    data:RouteRecordInput,
    params:Parameters,
    user:UserInterface
    ):Promise<recordRoutePlanResponse|undefined>{
    try {
      const vehicle = await this.vehicle.findById(params.vehicleId).populate('assignedTo');
      if(!vehicle) {
        throw new BadInputFormatException('selected vehicle was not found please pick an available vehicle')
      }
      let routePlan = new this.pickup({
        ...data,
        branch:user.branch,
        vehicle:vehicle._id
      });
      let availableRoutes = await this.pickup.find({}).sort({serialNo:-1}).limit(1);
      if(availableRoutes[0]) {
        routePlan.serialNo = availableRoutes[0].serialNo+1;
      }else {
        routePlan.serialNo = 1;
      }
      const num = padLeft(routePlan.serialNo , 6, "");
      // const ecr = "ECR"+num;

      routePlan.rppNo = "RPP"+num;
      // routePlan.ecrNo = ecr;
      let failed = [];
      let routePlanCust = []
      if(routePlan.orderType == pickupType.CUSTOMER) {
        for(let cust of routePlan.customers) {
          let checkCust = await this.customer.findOne({email:cust.email});
          if(checkCust) {
            routePlanCust.push(cust);
          }
          if(!checkCust) {
            failed.push(cust)
          }
        }
        routePlan.customers = routePlanCust;
      }
      if(routePlan.orderType == pickupType.SUPPLIER) {
        for(let sup of routePlan.suppliers) {
          let checkSupplier = await this.supplier.findOne({email:sup.email});
          if(checkSupplier) {
            routePlanCust.push(sup);
          }
          if(!checkSupplier) {
            failed.push(sup)
          }
        }
        routePlan.suppliers = routePlanCust;
      }
      if(routePlan.activity == RouteActivity.DELIVERY) {
        if(routePlan.orderType == pickupType.CUSTOMER) {
          for(let plan of routePlan.customers) {
            let delivery = await this.waybill.findOne({deliveryNo:plan.deliveryNo});
            if(delivery){
              delivery.route_plan_id = routePlan._id
              await delivery.save()
            }
          }
        }else if(routePlan.orderType == pickupType.SUPPLIER) {
          for(let plan of routePlan.suppliers) {
            let delivery = await this.waybill.findOne({deliveryNo:plan.deliveryNo});
            if(delivery){
              delivery.route_plan_id = routePlan._id
              await delivery.save();
            }
          }
        }
      }
      await routePlan.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Route plan',
          activity:`You added a route plan for ${vehicle.regNo}`,
          time: new Date().toISOString()
        }
      });
      let message = failed.length > 0 ? `some ${routePlan.orderType}'s were not registered` : "Route record successful";
      return Promise.resolve({
        route_plan: routePlan,
        failed,
        message
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async assignDriver(data:Parameters, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.findById(data.vehicleId);
      const driver = await this.user.findById(data.driver);
      //@ts-ignore
      vehicle?.assignedTo = data.driver;
      //@ts-ignore
      driver?.vehicle = vehicle?._id
      vehicle?.comments.push({
        //@ts-ignore
        comment:data.comment,
        commentBy:user._id
      });
      await vehicle?.save();
      await driver?.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Assign driver',
          activity:`You assigned ${driver?.name} to drive vehicle number ${vehicle?.regNo}`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async deleteVehicle(data:Parameters):Promise<DeleteResponse|undefined>{
    try {
      const { vehicleId } = data
      await this.vehicle.findByIdAndDelete(vehicleId);
      return Promise.resolve({
        message:'Vehicle deleted from the system'
      });
    } catch (e) {
      this.handleException(e);
    };
  }

  public async fetchallVehicles(user:UserInterface):Promise<VehicleInterface[]|undefined>{
    try {
      const vehicles = await this.vehicle.find({branch:user.branch});
      return Promise.resolve(vehicles);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async removeDriver(data:Parameters):Promise<VehicleInterface|undefined>{
    try {
      const { vehicleId, driver } = data;
      const vehicle = await this.vehicle.findById(vehicleId);
      // if(`${vehicle?.assignedTo}` == `${driver}`) {
      //   vehicle?.assignedTo = null
      // }
      //@ts-ignore
      vehicle?.assignedTo = null;
      await vehicle?.save();
      return Promise.resolve(vehicle as VehicleInterface)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchRoutePlan(data:Parameters):Promise<PickupInterface|undefined>{
    try {
      let ObjectId = mongoose.Types.ObjectId;
      let { routeId, query } = data;
      //@ts-ignore
      let {  email, supplier, customer, routeStatus } = query;
      console.log(routeId)
      let q = {
            _id:routeId
      }

      let routePlan = await this.pickup.findOne(q).populate(
        [
          {path:'customer', model:'customer'},
          {path:'supplier', model:'supplier'},
          {path:'vehicle', model:'vehicle' ,populate:{
            path:'assignedTo', model:"User"
          }},
          {path:"suppliers.cylinders", model:"registered-cylinders"},
          {path:"customers.cylinders", model:"registered-cylinders"},
          {path:'security', model:'User'},
          {path:'recievedBy', model:'User'}
        ]
      );
      console.log(routePlan)
      if(!routePlan) {
        throw new BadInputFormatException('Not found')
      }

      if(routeStatus) {
        if(routePlan.orderType == pickupType.CUSTOMER) {
          let custs = routePlan.customers.filter(customer=> customer.status == routeStatus)
          routePlan.customers = custs;
        }else if (routePlan.orderType == pickupType.SUPPLIER){
          let supls = routePlan.suppliers.filter(supplier=> supplier.status == routeStatus)
          routePlan.suppliers = supls;
        }
      }
      if(email) {
        if(routePlan.orderType == pickupType.CUSTOMER) {
          let custs = routePlan.customers.filter(customer=> customer.email == email)
          routePlan.customers = custs;
        }else if (routePlan.orderType == pickupType.SUPPLIER){
          let supls = routePlan.suppliers.filter(supplier=> supplier.email == email)
          routePlan.suppliers = supls;
        }
      }      
      return Promise.resolve(routePlan as PickupInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async vehicleRoutePlan(vehicleId:string, query:QueryInterface, user:UserInterface):Promise<PickupInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      
      let { driver, email, supplier, customer, search, fromDate, toDate, activity, orderType, routeStatus, status } = query;
      // console.log(orderType, routeStatus)
      let q = {
        vehicle:`${vehicleId}`,
        branch:user.branch
      }
      let or = [];
      if(search) {
        or.push({modeOfService: new RegExp(search, "gi")})
      }
      if(orderType == pickupType.SUPPLIER && email) {
        //@ts-ignore
        // q = {...q, 'customers.email': new RegExp(email, "gi")},
        or.push({'suppliers.email':new RegExp(email,'gi')})
      }
      if(orderType == pickupType.CUSTOMER && email) {
        //@ts-ignore
        // q = {...q, 'customers.email': new RegExp(email, "gi")},
        or.push({'customers.email': new RegExp(email, "gi")})
      }
      if(supplier) {
        //@ts-ignore
        // q ={...q,'suppliers.name': new RegExp(supplier, "gi")}
        or.push({'suppliers.name': new RegExp(supplier, "gi")})
      }
      if(routeStatus) {
        //@ts-ignore
        // q ={...q,'customers.status': routeStatus}
        or.push({'customers.status': new RegExp(routeStatus,'gi')})
        or.push({'suppliers.status': new RegExp(routeStatus,'gi')})
      }
      if(customer?.length) {
        //@ts-ignore
        // q = {...q, 'customers.name': new RegExp(customer, "gi")}
        or.push({'customers.name': new RegExp(customer, "gi")})
      }
      if(activity?.length) {
        //@ts-ignore
        q = {...q, 'activity': activity}
        // or.push({'activity': new RegExp(activity, "gi")})
      }
      if(orderType) {
        //@ts-ignore
        q = {...q, 'orderType': orderType}
        // or.push({'orderType': new RegExp(pickupType, "gi")})
      }
      if(fromDate) {
        //@ts-ignore
        q = {...q, createdAt:{ $gte:new Date(fromDate) }}
      }
      if(toDate) {
        //@ts-ignore
        q = {...q, createdAt:{ $lte:new Date(toDate) }}
      }
      if(status) {
        or.push({'status': new RegExp(status,'gi')})
      }
      // console.log(q)
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }

      const options = {
        page:query?.page || 1,
        limit:query?.limit || 10,
        populate:[
          {path:'customer', model:'customer'},
          {path:'supplier', model:'supplier'},
          {path:"suppliers.cylinders", model:"registered-cylinders"},
          {path:"customers.cylinders", model:"registered-cylinders"},
          {path:'vehicle', model:'vehicle',populate:{
            path:'assignedTo', model:"User"
          }},
          {path:'security', model:'User'},
          {path:'recievedBy', model:'User'}
        ],        
        sort:{createdAt:-1}
      }
      //@ts-ignore
      let v = await this.pickup.paginate(q, options)
      // .populate([
      //   {path:'customer', model:'customer'},
      //   {path:'supplier', model:'supplier'},
      //   {path:"suppliers.cylinders", model:"registered-cylinders"},
      //   {path:"customers.cylinders", model:"registered-cylinders"},
      //   {path:'vehicle', model:'vehicle',populate:{
      //     path:'assignedTo', model:"User"
      //   }},
      //   {path:'security', model:'User'},
      //   {path:'recievedBy', model:'User'}
      // ]);
      return Promise.resolve(v);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async RoutePlans(query:QueryInterface, user:UserInterface):Promise<PickupInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      
      let { driver, email, supplier, customer, search, fromDate, toDate, activity, pickupType } = query;

      let q = {
        branch:user.branch,
      }
      let or = [];
      if(search) {
        or.push({modeOfService: new RegExp(search || "", "gi")})
      }
      if(email) {
        //@ts-ignore
        q = {...q, 'customers.email': new RegExp(email, "gi")}
      }
      if(email && customer) {
        //@ts-ignore
        q = {...q, 'customers.email': new RegExp(email, "gi"), 'customers.name': new RegExp(customer, "gi")}
      }
      if(email && supplier) {
        //@ts-ignore
        q = {...q, 'suppliers.email': new RegExp(email, "gi"),'suppliers.name': new RegExp(supplier, "gi")}
      }
      if(supplier?.length) {
        //@ts-ignore
        q ={...q,'suppliers.name': new RegExp(supplier, "gi")}
      }
      if(customer?.length) {
        //@ts-ignore
        q = {...q, 'customers.name': new RegExp(customer, "gi")}
      }
      if(activity?.length) {
        //@ts-ignore
        q = {...q, 'activity': new RegExp(activity, "gi")}
      }
      if(pickupType?.length) {
        //@ts-ignore
        q = {...q, 'orderType': new RegExp(pickupType, "gi")}
      }
      if(fromDate) {
        //@ts-ignore
        q = {...q, createdAt:{ $gte:new Date(fromDate) }}
      }
      if(toDate) {
        //@ts-ignore
        q = {...q, createdAt:{ $lte:new Date(toDate) }}
      }
      // console.log(q)
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }

      const options = {
        page:query?.page || 1,
        limit:query?.limit || 10,
        populate:[
          {path:'customer', model:'customer'},
          {path:'supplier', model:'supplier'},
          {path:'vehicle', model:'vehicle', populate:{
            path:'assignedTo', model:"User"
          }},
          {path:'security', model:'User'},
          {path:'recievedBy', model:'User'}
        ],
        sort:{createdAt: -1}
      }
      //@ts-ignore
      let v = await this.pickup.paginate(q, options);
      return Promise.resolve(v);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async startRoute(routeId:string, data:startRouteInput):Promise<PickupInterface|undefined>{
    try {
      console.log(data, routeId);
      const plan = await this.pickup.findById(routeId).populate({
        path:'vehicle', model:'vehicle',populate:{
          path:'assignedTo', model:'User'
        }
      });
      if(!plan) {
        throw new BadInputFormatException('No Routeplan found for this Id');
      }
      if(plan?.orderType == pickupType.SUPPLIER) {
        if(plan.suppliers.length > 0){
          for(let supplier of plan.suppliers) {
            if(supplier.email == data.email) {
              let payload = {
                vehicle:plan.vehicle,
                dateStarted:new Date().toISOString(),
                departure:data.departure,
                client:supplier.name,
                destination:supplier.destination,
                mileageIn:data.mileIn,
                //@ts-ignore
                driver:plan.vehicle.assignedTo.name,
                routeInfo:plan._id
              }
              let routeReport = await this.routeReport.create(payload);
              //@ts-ignore
              supplier.status = RoutePlanStatus.PROGRESS;
              supplier.reportId = routeReport._id;
            }
          }
        }
      }else if(plan.orderType == pickupType.CUSTOMER) {
        if(plan.customers.length > 0) {
          for(let customer of plan.customers) {
            if(customer.email == data.email) {
              let payload = {
                vehicle:plan.vehicle,
                dateStarted:new Date().toISOString(),
                departure:data.departure,
                destination:customer.destination,
                client:customer.name,
                //@ts-ignore
                driver:plan.vehicle.assignedTo.name,
                routeInfo:plan._id,
                timeIn:new Date().getTime()
              }
              let routeReport = await this.routeReport.create(payload);
              //@ts-ignore
              customer.status = RoutePlanStatus.PROGRESS;
              customer.reportId = routeReport._id
            }
          }
        }
      }
      await plan.save();
      return Promise.resolve(plan);
    } catch(e){
      this.handleException(e);
    }
  }

  public async markRouteAsComplete(data:Parameters, user:UserInterface):Promise<any>{
    try {
      // console.log(user)
      const { query, ecrData, routeId } = data;
      // console.log(data)
      //@ts-ignore
      const { name, email, deliveryNo } = query;
      let TECR = ''
      const pickup = await this.pickup.findById(routeId);
      if(!pickup) {
        throw new BadInputFormatException('Route Plan not found');
      }
      let routeReport = await this.routeReport.findOne({ routeInfo: pickup?._id });
      if(!routeReport) {
        throw new BadInputFormatException('this route has not been started and thus cannot be marked as complete');
      }
      if(pickup?.orderType == pickupType.SUPPLIER && pickup.activity == RouteActivity.DELIVERY) {
        if(pickup.suppliers.length > 0){
          for(let supplier of pickup.suppliers) {
            if(supplier.email == email) {
              if(supplier.deliveryNo == deliveryNo) {
                if(supplier.cylinders.length > 0) {
                  for(let cylinder of supplier.cylinders) {
                      let cyl = await this.registerCylinder.findById(cylinder);
                      //@ts-ignore
                      cyl?.holder = cylinderHolder.SUPPLIER;
                      //@ts-ignore
                      cyl?.supplierType = supplier.supplierType;
                      cyl?.tracking.push({
                        heldBy:"supplier",
                        //@ts-ignore
                        name:supplier.name,
                        location:supplier.destination,
                        date:new Date().toISOString()
                      });
                      await cyl?.save();
                  }
                }
                //@ts-ignore
                supplier.status = RoutePlanStatus.DONE;
                let routeReport = await this.routeReport.findById(supplier.reportId);
                //@ts-ignore
                routeReport?.dateCompleted = new Date().toISOString();
                //@ts-ignore
                routeReport?.timeOut = new Date().getTime();
                //@ts-ignore
                routeReport?.mileageOut = data.mileageOut;
              }
            }
          }
        }
      }else if(pickup?.orderType == pickupType.CUSTOMER && pickup.activity == RouteActivity.DELIVERY){
        
        if(pickup.customers.length > 0){
          // console.log(email, deliveryNo)
          for(let customer of pickup.customers) {
            if(customer.email == email) {
              if(customer.deliveryNo == deliveryNo) {
               console.log(email, deliveryNo)
                if(customer.cylinders.length > 0) {
                  for(let cylinder of customer.cylinders) {
                      let cyl = await this.registerCylinder.findById(cylinder);
                      //@ts-ignore
                      cyl?.holder = cylinderHolder.CUSTOMER;
                      cyl?.tracking.push({
                        heldBy:"customer",
                        name:customer.name,
                        location:customer.destination,
                        date:new Date().toISOString()
                      });
                      await cyl?.save();
                  }
                }
                //@ts-ignore
                customer.status = RoutePlanStatus.DONE;
                let routeReport = await this.routeReport.findById(customer.reportId);
                //@ts-ignore
                routeReport?.dateCompleted = new Date().toISOString();
                //@ts-ignore
                routeReport?.mileageOut = data.mileageOut;
                //@ts-ignore
                routeReport?.timeOut = new Date().getTime();
              }
            }
          }
        }
      }else if(pickup?.activity == RouteActivity.PICKUP && pickup?.orderType == pickupType.CUSTOMER){
        if(pickup.customers.length > 0){
          for(let customer of pickup.customers) {
            if(customer.email == `${email}`) {
              if(customer.cylinders.length > 0) {
                for(let cylinder of customer.cylinders) {
                    let cyl = await this.registerCylinder.findById(cylinder);
                    //@ts-ignore
                    cyl?.holder = cylinderHolder.ASNL;
                    cyl?.tracking.push({
                      heldBy:"asnl",
                      name:"ASNL",
                      location:customer.destination,
                      date:new Date().toISOString()
                    });
                    await cyl?.save();
                }
              }
              //@ts-ignore
              customer.status = RoutePlanStatus.DONE;
              customer.tecrNo = pickup.tecrNo;
              let routeReport = await this.routeReport.findById(customer.reportId);
              //@ts-ignore
              routeReport?.dateCompleted = new Date().toISOString();
              //@ts-ignore
              routeReport?.mileageOut = data.mileageOut;
              //@ts-ignore
              routeReport?.timeOut = new Date().getTime();
              //TO-DO create tecr
              let {ecrNo} = await this.createTecr({
                customer,
                ecrData
              }, user);
              // console.log(ecr)
              TECR = ecrNo;
            }
          }
        }
      }else if(pickup?.activity == RouteActivity.PICKUP && pickup?.orderType == pickupType.SUPPLIER){
        if(pickup.suppliers.length > 0){
          for(let supplier of pickup.suppliers) {
            if(supplier.email == `${email}`) {
              if(supplier.cylinders.length > 0) {
                for(let cylinder of supplier.cylinders) {
                    let cyl = await this.registerCylinder.findById(cylinder);
                    //@ts-ignore
                    cyl?.holder = cylinderHolder.ASNL;
                    cyl?.tracking.push({
                      heldBy:"supplier",
                      //@ts-ignore
                      name:supplier.name,
                      location:supplier.destination,
                      date:new Date().toISOString()
                    });
                    await cyl?.save();
                }
              }
              //@ts-ignore
              supplier.status = RoutePlanStatus.DONE
              supplier.tfcrNo = pickup.tfcrNo;
              let routeReport = await this.routeReport.findById(supplier.reportId);
              //@ts-ignore
              routeReport?.dateCompleted = new Date().toISOString();
              //@ts-ignore
              routeReport?.mileageOut = data.mileageOut;
              //@ts-ignore
              routeReport?.timeOut = new Date().getTime();
              let {ecrNo} = await this.createTecr({
                supplier,
                ecrData
              }, user)
              // console.log(ecr)
              TECR = ecrNo;
            }
          }
        }
      }
      await pickup?.save();
      await routeReport.save();
      return Promise.resolve({
          pickup,
          tecr:TECR,
          message:`An otp has been sent to the customer's registered email`
        });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async createTecr(data:any, user:UserInterface):Promise<any>{
    try {
      let { customer, supplier, ecrData } = data;
      let responseData;
      if(customer) {
        let cust = await this.customer.findOne({email:customer.email});
        let ecr = new this.ecr({
          ...ecrData
        });
        let available = await this.ecr.find({}).sort({initNum:-1}).limit(1);
        if(available[0]) {
          //@ts-ignore
          ecr.initNum = available[0].initNum+1;
        }else {
          ecr.initNum = 1;
        }
        if(cust) {
          ecr.customer = cust._id
        }            
        ecr.priority = Priority.TRUCK
        ecr.type = EcrType.TRUCK
        ecr.status = EcrApproval.TRUCK
        ecr.position = ProductionSchedule.TRUCK
        ecr.branch = user.branch
        ecr.initiator= user._id

        let num = padLeft(ecr.initNum , 6, "");
        const ecrN = "TECR"+num;
        let otp = Math.floor(1000 + Math.random() * 9000);
        ecr.otp = otp.toString();
        ecr.ecrNo = ecrN;
        await ecr.save();
        responseData = ecr;
        const html = await getTemplate('OTP', {//8639
          name:cust?.name,
          email:cust?.email,
          otp:`${otp}`,
          driver:user.name,
          ref:ecr.ecrNo
        });
        let mailLoad = {
          content:html,
          subject:'Complete TECR',
          email:cust?.email,
        }//@ts-ignore
        new Notify().sendMail(mailLoad);
      }else if(supplier) {
        let suppl = await this.supplier.findOne({email:supplier.email});
            let ecr = new this.ecr({
              ...ecrData
            });
            let available = await this.ecr.find({}).sort({initNum:-1}).limit(1);
            if(available[0]) {
              //@ts-ignore
              ecr.initNum = available[0].initNum+1;
            }else {
              ecr.initNum = 1;
            }
            if(suppl) {
              ecr.supplier = suppl._id
            }            
            ecr.priority = Priority.TRUCK
            ecr.type = EcrType.TRUCK
            ecr.status = EcrApproval.TRUCK
            ecr.position = ProductionSchedule.TRUCK
            ecr.branch = user.branch
            ecr.initiator= user._id

            let num = padLeft(ecr.initNum , 6, "");
            const ecrN = "TFCR"+num;
            let otp = Math.floor(1000 + Math.random() * 9000);
            ecr.otp = otp.toString();
            ecr.ecrNo = ecrN;
            await ecr.save();
            responseData = ecr;

            const html = await getTemplate('OTP', {//8639
              name:suppl?.name,
              email:suppl?.email,
              otp:`${otp}`,
              driver:user.name,
              ref:ecr.ecrNo
            });
            let mailLoad = {
              content:html,
              subject:'Complete TFCR',
              email:suppl?.email,
            }//@ts-ignore
            new Notify().sendMail(mailLoad);
      }
            return responseData;
    } catch (e) {
      this.handleException(e);
    }
  }

  public async marAsCompletedRoutePlan(routeId:string):Promise<any>{
    try {
      let routePlan = await this.pickup.findById(routeId)
      if(!routePlan) {
        throw new BadInputFormatException('routePlan not found')
      }
      routePlan.status = RoutePlanStatus.DONE
      await routePlan.save();
      return routePlan
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchActivityLogs(userId:string):Promise<ActivityLogInterface|undefined>{
    try {
      let user = await this.user.findById(userId);
      const logs = await this.activity.findOne({user:user?._id});
      //@ts-ignore
      logs?.activities.sort((a,b)=> b.createdAt - a.createdAt);
      return Promise.resolve(logs as ActivityLogInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchVehiclePerformance(query:QueryInterface, vehicleId:string):Promise<vehiclePerformance[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId
      let { search, filter, fromDate, toDate, page, limit } = query;
      const options = {
        page: page || 1,
        limit: limit || 10,
        sort:{createdAt:-1}
      }

      let q = {
        vehicle: vehicleId
      }

      let or = [];

      if(fromDate) {
        //@ts-ignore
        q = {...q, dateCompleted: {'$gte':new Date(fromDate)}}
      }
      if(toDate) {
        //@ts-ignore
        q = {...q, dateCompleted: {'$lte':new Date(toDate)}}
      }
      if(search) {
        or.push({client: new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      //@ts-ignore
      const performance = await this.routeReport.paginate(q, options);
      return Promise.resolve(performance);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async genWaybill(data:newWaybillInterface, user:UserInterface):Promise<WayBillInterface|undefined>{
    try {
      let delivery = new this.waybill({...data, branch:user.branch});
      let dn = await this.waybill.find({}).sort({numInit:-1}).limit(1);
      let wbNo;
      if(dn[0]) {
        wbNo = dn[0].numInit + 1;
      }else {
        wbNo = 1
      }
      let deliveryNo = padLeft(wbNo, 6, '');
      delivery.deliveryNo = "D"+deliveryNo;
      delivery.numInit = wbNo;

      let invoice = await this.invoice.findById(delivery.invoice_id)
          if(invoice){
              invoice.delivery_id = delivery._id;
              await invoice.save();
          }
      await delivery.save();
      return Promise.resolve(delivery);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchWaybills(query:QueryInterface, user:UserInterface):Promise<WayBillInterface[]|undefined>{
    try {
      let { search, page, limit } = query;
      let options = {
        page: page||1,
        limit: limit||10,
        populate:[
          {path:'branch', model:'branches'},
          {path:'ocn', model:'out-going-cylinders'},
          {path:'customer.id', model:'customer'}
        ],
        sort:{createdAt: -1}
      }
      let q = {
        branch:user.branch,
        route_plan_id:null
      }
      console.log(q)
      let or = [];
      if(search) {
        or.push({customer: new RegExp(search, 'gi')})
        or.push({'cylinders.cylinderNo':new RegExp(search, 'gi')})
        or.push({invoiceNo: new RegExp(search, 'gi')})
        or.push({deliveryType: new RegExp(search, 'gi')})
        or.push({lpoNo: new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      //@ts-ignore
      let delivery = await this.waybill.paginate(q, options);
      return Promise.resolve(delivery);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDeliveryDetails(deliveryId:string, user:UserInterface):Promise<WayBillInterface|undefined>{
    try {
      let delivery = await this.waybill.findById(deliveryId).populate([
        {path:'branch', model:'branches'},
        {path:'ocn', model:'out-going-cylinders'},
        {path:'customer.id', model:'customer'}
      ]);
      return Promise.resolve(delivery as WayBillInterface);
    } catch (e) {
      this.handleException(e)
    }
  }
}


export default Vehicle;
