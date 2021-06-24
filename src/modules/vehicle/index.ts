import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { PickupInterface } from "../../models/driverPickup";
import { UserInterface } from "../../models/user";
import { Disposal, InspectApproval, Maintainance, maintType, RecordRoute, RouteActivity, VehicleInterface } from "../../models/vehicle";
import Module, { QueryInterface } from "../module";
import env from '../../configs/static';
import Notify from '../../util/mail';
import { createLog } from "../../util/logs";
import { ActivityLogInterface } from "../../models/logs";
import { pickupType } from "../../models/order";
import { cylinderHolder, RegisteredCylinderInterface } from "../../models/registeredCylinders";
import { generateToken } from "../../util/token";

interface vehicleProps{
  vehicle:Model<VehicleInterface>
  pickup:Model<PickupInterface>
  user:Model<UserInterface>
  activity:Model<ActivityLogInterface>,
  registerCylinder:Model<RegisteredCylinderInterface>
}

type NewVehicle = {
  vehicleType:VehicleInterface['vehicleType']
  manufacturer:VehicleInterface['manufacturer']
  vModel:VehicleInterface['vModel']
  regNo:VehicleInterface['regNo']
  acqisistionDate:VehicleInterface['acqisistionDate']
  mileageDate:VehicleInterface['mileageDate']
  currMile:VehicleInterface['currMile']
  assignedTo:VehicleInterface['assignedTo']
  vehCategory:VehicleInterface['vehCategory']
  tankCapacity:VehicleInterface['tankCapacity']
  batteryCapacity:VehicleInterface['batteryCapacity']
  fuelType:VehicleInterface['fuelType']
  grossHeight:VehicleInterface['grossHeight']
  netWeight:VehicleInterface['netWeight']
  disposal:VehicleInterface['disposal'],
  licence:VehicleInterface['licence']
  insuranceDate:VehicleInterface['insuranceDate']
  lastMileage?:VehicleInterface['lastMileage']
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
}

type RouteRecordInput = {
  customer:PickupInterface['customer'],
  startDate:PickupInterface['startDate'],
  endDate?:PickupInterface['endDate'],
  activity:PickupInterface['activity'],
  destination:PickupInterface['destination'],
  departure:PickupInterface['departure'],
  status:PickupInterface['status'],
  ecrNo:PickupInterface['ecrNo'],
  icnNo:PickupInterface['icnNo'],
  orderType:PickupInterface['orderType'],
  modeOfService:PickupInterface['modeOfService'],
  date:PickupInterface['date'],
  serialNo:number
  cylinders:PickupInterface['cylinders'],
  vehicle:PickupInterface['vehicle'],
  recievedBy:PickupInterface['recievedBy'],
  security:PickupInterface['security'],
}



type Parameters = {
  vehicleId?:string
  routeId?:string
  inspectionId?:string
  comment?:string
  driver?:string
  status?:string,
  query?:QueryInterface
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

  constructor(props:vehicleProps) {
    super()
    this.vehicle = props.vehicle
    this.pickup = props.pickup;
    this.user = props.user
    this.activity = props.activity
    this.registerCylinder = props.registerCylinder
  }
  public async createVehicle(data:NewVehicle, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.create({...data, branch:user.branch});
      await createLog({
        user:user._id,
        activities:{
          title:'create vehicle',
          activity:`You added a vehicle to your vehicle list`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(vehicle);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchVehicles(query:QueryInterface, user:UserInterface):Promise<VehicleInterface[]|undefined> {
    try {
      //@ts-ignore
      const vehicles = await this.vehicle.paginate({ branch:user.branch }, {...query});
      return Promise.resolve(vehicles)
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
        approvalStatus:InspectApproval.PENDING
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
        content: `A vehicle inspection request requires your approval. click to view ${process.env.FRONTEND_URL}/view-inspection-history/${vehicle?._id}`,
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
      const vehicle = await this.vehicle.findById(params.vehicleId);
      if(!vehicle) {
        throw new BadInputFormatException('selected vehicle was not found please pick an available vehicle')
      }
      let routePlan = new this.pickup({
        ...data,
        branch:user.branch,
        vehicle:vehicle._id
      });
      let availableRoutes = await this.pickup.find({});
      routePlan.serialNo = availableRoutes.length + 1;
      if(routePlan.orderType == pickupType.CUSTOMER) {
        if(routePlan.activity == RouteActivity.PICKUP) {
          let init = 'TECR'
          let num = await generateToken(6);
          //@ts-ignore
          let tecrNo = init + num.toString();
          routePlan.tecrNo = tecrNo
        } else if(routePlan.activity == RouteActivity.DELIVERY) {
          let init = 'TFCR'
          let num = await generateToken(6);
          //@ts-ignore
          let tfcrNo = init + num.toString();
          routePlan.tfcrNo = tfcrNo
        }
      }else if(routePlan.orderType == pickupType.SUPPLIER) {
        if(routePlan.activity == RouteActivity.DELIVERY) {
          let init = 'TECR'
          let num = await generateToken(6);
          //@ts-ignore
          let tecrNo = init + num.toString();
          routePlan.tecrNo = tecrNo
        } else if(routePlan.activity == RouteActivity.PICKUP) {
          let init = 'TFCR'
          let num = await generateToken(6);
          //@ts-ignore
          let tfcrNo = init + num.toString();
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
      const { vehicleId, query } = data;
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
      //@ts-ignore
      const routePlan = await this.pickup.paginate({vehicle:`${vehicleId}`, deleted:false}, options);
      return Promise.resolve(routePlan);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async markRouteAsComplete(data:Parameters):Promise<PickupInterface|undefined>{
    try {
      const { status, routeId } = data;
      const pickup = await this.pickup.findById(routeId);
      if(pickup?.orderType == pickupType.SUPPLIER && pickup.activity == RouteActivity.DELIVERY) {
        for(var cylinder of pickup.cylinders) {
          let cyl = await this.registerCylinder.findOne({cylinderNumber:cylinder.cylinderNo});
          //@ts-ignore
          cyl?.holder = cylinderHolder.SUPPLIER;
          await cyl?.save();
        }
      }else if(pickup?.orderType == pickupType.CUSTOMER && pickup.activity == RouteActivity.DELIVERY){
        for(var cylinder of pickup.cylinders) {
          let cyl = await this.registerCylinder.findOne({cylinderNumber:cylinder.cylinderNo});
          //@ts-ignore
          cyl?.holder = cylinderHolder.CUSTOMER;
          await cyl?.save();
        }
      }else if(pickup?.activity == RouteActivity.PICKUP){
        for(var cylinder of pickup.cylinders) {
          let cyl = await this.registerCylinder.findOne({cylinderNumber:cylinder.cylinderNo});
          //@ts-ignore
          cyl?.holder = cylinderHolder.ASNL;
          await cyl?.save();
        }
      }
      //@ts-ignore
      pickup?.status = status;
      return Promise.resolve(pickup as PickupInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchActivityLogs(userId:string):Promise<ActivityLogInterface|undefined>{
    try {
      let user = await this.user.findById(userId);
      const logs = await this.activity.findOne({user:user?._id});
      return Promise.resolve(logs as ActivityLogInterface);
    } catch (e) {
      this.handleException(e);
    }
  }
}


export default Vehicle;
