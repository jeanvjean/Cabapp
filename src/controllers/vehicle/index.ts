/* eslint-disable @typescript-eslint/explicit-function-return-type */

/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import {RequestHandler, Response, Request} from 'express';
import {VehicleInterface} from '../../models/vehicle';
import Vehicle from '../../modules/vehicle';
import Ctrl from '../ctrl';
import Validator from './validator';

class VehicleController extends Ctrl {
  private module: Vehicle

  constructor(module: Vehicle) {
    super();
    this.module = module;
  }

  createVehicle(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const vehicle: VehicleInterface|undefined = await this.module.createVehicle(req.body, req.user);
        this.ok(res, 'Created', vehicle);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  updateVehicle(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.updateVehicle({...req.body, vehicleId: req.params.vehicleId}, req.user);
        this.ok(res, 'updated vehicle', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchVehicles(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const vehicles = await this.module.fetchVehicles(req.query, req.user);
        this.ok(res, 'Fetched list', vehicles);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchVehicle(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const vehicle = await this.module.fetchVehicle(req.params.id);
        this.ok(res, 'details fetched', vehicle);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  vehicleInspection(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const vehicle = await this.module.vehicleInspection( req.params.vehicleId, req.body, req.user);
        this.ok(res, 'Recorded', vehicle);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchInspectionHistory(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        // @ts-ignore
        const data = await this.module.fetchInspectionHist(req.params.vehicleId, req.query);
        this.ok(res, 'History fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  approveInspection(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {vehicleId, inspectionId} = req.params;
        const {status, comment} = req.body;
        // @ts-ignore
        const data = await this.module.aprroveInspection({vehicleId, inspectionId, status, comment}, req.user);
        this.ok(res, 'Approved', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  recordRoute(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        // @ts-ignore
        const data = await this.module.recordRoute({...req.body, vehicle: req.params.vehicleId}, req.params, req.user);
        this.ok(res, data?.message, data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  startRoute(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.startRoute(req.params.routeId, req.body);
        this.ok(res, 'route plan started', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchVehiclePerformance(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchVehiclePerformance(req.query, req.params.vehicleId);
        this.ok(res, 'vehicle history', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchRoutePlan(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {routeId} = req.params;
        // @ts-ignore
        const data = await this.module.fetchRoutePlan({routeId, query: req.query});
        this.ok(res, 'fetched route plans', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  assignDriver(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        const {vehicleId} = req.params;
        const {comment, driver} = req.body;
        // @ts-ignore
        const data = await this.module.assignDriver({vehicleId, comment, driver}, req.user );
        this.ok(res, 'Driver has been assigned', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  deleteVehicle(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.deleteVehicle({vehicleId: req.params.vehicleId});
        this.ok(res, 'Vehicle deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  removeDriver(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {vehicleId, driver} = req.params;
        const data = await this.module.removeDriver({vehicleId, driver});
        this.ok(res, 'Driver removed', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  markRouteAsComplete(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {vehicleId, routeId} = req.params;
        const {status, ecr} = req.body;
        // @ts-ignore
        const data = await this.module.markRouteAsComplete({routeId, status, query: req.query, ecrData: ecr}, req.user);
        this.ok(res, 'Completed', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  viewInspectionDetails(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {vehicleId, inspectionId} = req.params;
        const data = await this.module.viewInspection({vehicleId, inspectionId});
        this.ok(res, 'vehicle inspection details', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchActivityLogs(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.fetchActivityLogs(req.params.userId);
        this.ok(res, 'activity logs fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchallVehicles(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchallVehicles(req.user);
        this.ok(res, 'vehicles fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  vehicleRoutePlan(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.vehicleRoutePlan(req.params.vehicleId, req.query, req.user);
        this.ok(res, 'vehicle route plans', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  RoutePlans(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.RoutePlans(req.query, req.user);
        this.ok(res, 'route plans', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  genWaybill(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.genWaybill(req.body, req.user);
        this.ok(res, 'created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchWaybills(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchWaybills(req.query, req.user);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchDeliveryDetails(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchDeliveryDetails(req.params.id, req.user);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  marAsCompletedRoutePlan(): RequestHandler {
    return async (req, res)=>{
      try {
        const data = await this.module.marAsCompletedRoutePlan(req.params.routeId);
        this.ok(res, 'done', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  addTerritory(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.addTerritory(req.body, req.user);
        this.ok(res, 'done', data);
      } catch (error) {
        this.handleError(error, req, res);
      }
    };
  }

  fetchTerritory(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        // @ts-ignore
        const data = await this.module.fetchTerritory(req.query, req.user);
        this.ok(res, 'done', data);
      } catch (error) {
        this.handleError(error, req, res);
      }
    };
  }

  deleteTerretory(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.deleteTerretory(req.params.terretoryId);
        this.ok(res, 'done', data);
      } catch (error) {
        this.handleError(error, req, res);
      }
    };
  }
}

export {Validator};

export default VehicleController;
