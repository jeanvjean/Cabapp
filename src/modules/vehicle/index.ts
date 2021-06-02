import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { PickupInterface } from "../../models/driverPickup";
import { stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { Disposal, InspectApproval, Maintainance, maintType, RecordRoute, RouteActivity, VehicleInterface } from "../../models/vehicle";
import Module, { QueryInterface } from "../module";
import env from '../../configs/static';
import Notify from '../../util/mail';
import { createLog } from "../../util/logs";
import { ActivityLogInterface } from "../../models/logs";

interface vehicleProps{
  vehicle:Model<VehicleInterface>
  pickup:Model<PickupInterface>
  user:Model<UserInterface>
  activity:Model<ActivityLogInterface>
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
  status?:string
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

  constructor(props:vehicleProps) {
    super()
    this.vehicle = props.vehicle
    this.pickup = props.pickup;
    this.user = props.user
    this.activity = props.activity
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
      const vehicles = await this.vehicle.find({...query, branch:user.branch});
      return Promise.resolve(vehicles)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchVehicle(id:string):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.findById(id);
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
      const { vehicleId } = data;
      //@ts-ignore
      const routePlan = await this.pickup.find({vehicle:`${vehicleId}`, deleted:false});
      return Promise.resolve(routePlan);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async markRouteAsComplete(data:Parameters):Promise<PickupInterface|undefined>{
    try {
      const { status, routeId } = data;
      const pickup = await this.pickup.findById(routeId);
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
