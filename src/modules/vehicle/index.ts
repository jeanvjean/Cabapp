import { Model } from "mongoose";
import { user } from "..";
import { stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { Disposal, InspectApproval, Maintainance, maintType, RecordRoute, RouteActivity, VehicleInterface } from "../../models/vehicle";
import Module, { QueryInterface } from "../module";

interface vehicleProps{
  vehicle:Model<VehicleInterface>
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
  driver:RecordRoute['driver']
  activity:RecordRoute['activity']
  startDate:RecordRoute['startDate']
  endDate?:RecordRoute['endDate']
  destination:RecordRoute['destination']
  departure:RecordRoute['departure']
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

type DeleteResponse = {
  message:string
}

class Vehicle extends Module{
  private vehicle:Model<VehicleInterface>

  constructor(props:vehicleProps) {
    super()
    this.vehicle = props.vehicle
  }
  public async createVehicle(data:NewVehicle):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.create(data);
      return Promise.resolve(vehicle);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchVehicles(query:QueryInterface):Promise<VehicleInterface[]|undefined> {
    try {
      const vehicles = await this.vehicle.find(query);
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
      return Promise.resolve(vehicle as VehicleInterface);
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
      //@ts-ignore
      let inspection = vehicle?.maintainace.filter(inspect=>`${inspect._id}` == `${data.inspectionId}`);
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
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async recordRoute(
    data:RouteRecordInput,
    params:Parameters,
    user:UserInterface
    ):Promise<VehicleInterface|undefined>{
    try {
      console.log(params);
      const vehicle = await this.vehicle.findById(params.vehicleId);
      let route;
      if(data.activity == RouteActivity.DELIVERY) {
        route = {
          driver:data.driver,
          startDate:data.startDate,
          endDate:data.endDate,
          activity:RouteActivity.DELIVERY,
          destination:data.destination,
          departure:data.departure
        }
      } else if(data.activity == RouteActivity.PICKUP){
        route = {
          driver:data.driver,
          startDate:data.startDate,
          endDate:data.endDate,
          activity:RouteActivity.DELIVERY,
          destination:data.destination,
          departure:data.departure
        }
      }
      //@ts-ignore
      vehicle?.routes.push(route);
      await vehicle?.save();
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async assignDriver(data:Parameters, user:UserInterface):Promise<VehicleInterface|undefined>{
    try {
      const vehicle = await this.vehicle.findById(data.vehicleId);
      //@ts-ignore
      vehicle?.assignedTo = data.driver;
      vehicle?.comments.push({
        //@ts-ignore
        comment:data.comment,
        commentBy:user._id
      });
      await vehicle?.save();
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

  public async fetchRoutePlan(data:Parameters):Promise<any>{
    try {
      const { vehicleId } = data;
      const vehicle = await this.vehicle.findById(vehicleId);
      let routePlan = vehicle?.routes;
      return Promise.resolve({
        routePlan
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async markRouteAsComplete(data:Parameters):Promise<VehicleInterface|undefined>{
    try {
      const { vehicleId, status, routeId } = data;
      const vehicle = await this.vehicle.findById(vehicleId);
      //@ts-ignore
      let route = vehicle?.routes.filter(route=> `${route._id}` == `${routeId}`);
      //@ts-ignore
      route[0].status = status;
      vehicle?.save();
      return Promise.resolve(vehicle as VehicleInterface);
    } catch (e) {
      this.handleException(e);
    }
  }
}


export default Vehicle;
