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
import { pickupType } from "../../models/order";
import { cylinderHolder, RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { generateToken, padLeft } from "../../util/token";
import * as schedule from 'node-schedule'
import { getTemplate } from '../../util/resolve-template';
import { vehiclePerformance } from "../../models/pickupReport";
import router from "../../routes/person";
import { mongoose } from "../cylinder";
import { CustomerInterface } from "../../models/customer";
import { SupplierInterface } from "../../models/supplier";

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
  name?:string;
  mileIn?:string,
  mileOut?:string
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



type Parameters = {
  vehicleId?:string
  routeId?:string
  inspectionId?:string
  comment?:string
  driver?:string
  status?:string,
  query?:QueryInterface,
  mileageOut?:string
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

  public async fetchVehicles(query:QueryInterface, user:UserInterface):Promise<VehicleInterface[]|undefined> {
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search } = query;
      const options = {
        ...query
      }
      let aggregate = this.vehicle.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {
                    vehCategory:{
                      $regex: search || ""
                    }
                  }
                ]
              },
              {branch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ])
      //@ts-ignore
      const vehicles = await this.vehicle.aggregatePaginate(aggregate, options);
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
    ):Promise<PickupInterface|undefined>{
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
      const ecr = "ECR"+num;
      routePlan.ecrNo = ecr;
      // routePlan.icnNo = "ICN"+num;
      if(routePlan.orderType == pickupType.CUSTOMER) {
        if(routePlan.activity == RouteActivity.PICKUP) {
          let init = 'TECR'
          //@ts-ignore
          let tecrNo = init+num;
          routePlan.tecrNo = tecrNo
        } else if(routePlan.activity == RouteActivity.DELIVERY) {
          let init = 'TFCR'
          //@ts-ignore
          let tfcrNo = init+num;
          routePlan.tfcrNo = tfcrNo
        }
      }else if(routePlan.orderType == pickupType.SUPPLIER) {
        if(routePlan.activity == RouteActivity.DELIVERY) {
          let init = 'TECR'
          let tecrNo = init+num;
          routePlan.tecrNo = tecrNo
        } else if(routePlan.activity == RouteActivity.PICKUP) {
          let init = 'TFCR'
          //@ts-ignore
          let tfcrNo = init+num;
          routePlan.tfcrNo = tfcrNo
        }
      }
      // console.log(routePlan);
      await routePlan.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Route plan',
          activity:`You added a route plan for ${vehicle.regNo}`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(routePlan as PickupInterface);
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

  public async fetchRoutePlan(data:Parameters):Promise<PickupInterface[]|undefined>{
    try {
      let ObjectId = mongoose.Types.ObjectId;
      let { vehicleId, query } = data;
      const search = query?.search;
      if(search?.length) {
        let u = await this.user.findOne({name:search, role:"sales", subrole:"driver"});
        let vi = await this.vehicle.findOne({assignedTo:u?._id});
        if(!vi) {
          throw new BadInputFormatException('Driver\'s vehicle information not found');
        }
        vehicleId = vi?._id;
      }
      const options = {
        ...query,
        populate:[
          {path:'customer', model:'customer'},
          {path:'supplier', model:'supplier'},
          {path:'vehicle', model:'vehicle'},
          {path:'security', model:'User'},
          {path:'recievedBy', model:'User'}
        ]
      }
      let aggregate;
      let aggregate1 = this.pickup.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {
                    modeOfService:{
                      $regex: search?.toLowerCase() || ""
                    }
                  }
              ]
              },
              {vehicle:ObjectId(`${vehicleId}`)},
              {deleted:false}
            ]
          }
        }
      ]);
      let aggregate2 = this.pickup.aggregate([
        {
          $match:{
            //@ts-ignore
            createdAt:{$gte:new Date(query?.fromDate), $lte:new Date(query?.toDate)},
            $and:[
              {
                $or:[
                  {
                    modeOfService:{
                      $regex: search?.toLowerCase() || ""
                    }
                  }
                ]
              }
            ]
          }
        }
      ]);
      if(query?.fromDate) {
        aggregate = aggregate2;
      }else {
        aggregate = aggregate1;
      }
      //@ts-ignore
      const routePlan = await this.pickup.aggregatePaginate(aggregate, options);
      for(let route of routePlan.docs) {
        route.customer = await this.customer.findById(route.customer);
        route.supplier = await this.supplier.findById(route.supplier);
        route.vehicle = await this.vehicle.findById(route.vehicle).populate('assignedTo');
        route.security = await this.user.findById(route.security);
        route.recievedBy = await this.user.findById(route.recievedBy);
      }
      return Promise.resolve(routePlan);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async vehicleRoutePlan(vehicleId:string):Promise<PickupInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      //@ts-ignore
      const vr = await this.pickup.find({vehicle:vehicleId});;
      return Promise.resolve(vr);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async startRoute(routeId:string, data:startRouteInput):Promise<PickupInterface|undefined>{
    try {
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
            if(supplier.name == data.name) {
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
            if(customer.name == data.name) {
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

  public async markRouteAsComplete(data:Parameters):Promise<PickupInterface|undefined>{
    try {
      const { query } = data;
      //@ts-ignore
      const { search } = query;
      const { status, routeId } = data;
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
            if(supplier.name == `${search}`) {
              if(supplier.cylinders.length > 0) {
                for(let cylinder of supplier.cylinders) {
                    let cyl = await this.registerCylinder.findById(cylinder);
                    //@ts-ignore
                    cyl?.holder = cylinderHolder.SUPPLIER;
                    cyl?.tracking.push({
                      heldBy:"supplier",
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
      }else if(pickup?.orderType == pickupType.CUSTOMER && pickup.activity == RouteActivity.DELIVERY){
        if(pickup.customers.length > 0){
          for(let customer of pickup.customers) {
            if(customer.name == `${search}`) {
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
      }else if(pickup?.activity == RouteActivity.PICKUP && pickup?.orderType == pickupType.CUSTOMER){
        if(pickup.customers.length > 0){
          for(let customer of pickup.customers) {
            if(customer.name == `${search}`) {
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
              customer.status = RoutePlanStatus.DONE              
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
      }else if(pickup?.activity == RouteActivity.PICKUP && pickup?.orderType == pickupType.SUPPLIER){
        if(pickup.suppliers.length > 0){
          for(let supplier of pickup.suppliers) {
            if(supplier.name == `${search}`) {
              if(supplier.cylinders.length > 0) {
                for(let cylinder of supplier.cylinders) {
                    let cyl = await this.registerCylinder.findById(cylinder);
                    //@ts-ignore
                    cyl?.holder = cylinderHolder.SUPPLIER;
                    cyl?.tracking.push({
                      heldBy:"supplier",
                      name:supplier.name,
                      location:supplier.destination,
                      date:new Date().toISOString()
                    });
                    await cyl?.save();
                }
              }
              //@ts-ignore
              supplier.status = RoutePlanStatus.DONE
              let routeReport = await this.routeReport.findById(supplier.reportId);
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
      //@ts-ignore
      // pickup?.dateCompleted = new Date().toISOString();
      // routeReport.dateCompleted = pickup.dateCompleted;
      // //@ts-ignore
      // pickup?.status = status;
      await pickup?.save();
      await routeReport.save();
      return Promise.resolve(pickup as PickupInterface);
    } catch (e) {
      this.handleException(e);
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
      const options = {
        ...query
      }
      let { search, filter, fromDate, toDate } = query;
      let aggregate;
      let aggregate1 = this.routeReport.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {client:{
                    $regex:search?.toLowerCase() || ''
                  }}
                ]
              },
              {vehicle: ObjectId(vehicleId)}
            ]
          }
        }
      ]);
      let aggregate2 = this.routeReport.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {client:{
                    $regex:search?.toLowerCase() || ''
                  }}
                ]
              },
              {vehicle: ObjectId(vehicleId)},
              {dateCompleted: {'$gte':fromDate}}
            ]
          }
        }
      ]);
      let aggregate3 = this.routeReport.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {client:{
                    $regex:search?.toLowerCase() || ''
                  }}
                ]
              },
              {vehicle: ObjectId(vehicleId)},
              {dateCompleted: {"$gte":new Date().toISOString(),'$lte':toDate}}
            ]
          }
        }
      ]);
      let aggregate4 = this.routeReport.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {client:{
                    $regex:search?.toLowerCase() || ''
                  }}
                ]
              },
              {vehicle: ObjectId(vehicleId)},
              {dateCompleted: {"$gte":fromDate,'$lte':toDate}}
            ]
          }
        }
      ]);
      if(fromDate.length && toDate.length) {
        aggregate = aggregate4;
      }else if(fromDate.length && !toDate.length) {
        aggregate = aggregate2;
      }else if(!fromDate.length && toDate.length){
        aggregate= aggregate3
      }else{
        aggregate=aggregate1
      }
      //@ts-ignore
      const performance = await this.routeReport.aggregatePaginate(aggregate, options);
      return Promise.resolve(performance);
    } catch (e) {
      this.handleException(e);
    }
  }
}


export default Vehicle;
