import Ctrl from "../ctrl";
import Production from '../../modules/production'
import Validator from './validator';
import { Request, RequestHandler, Response } from "express";


class ProductionController extends Ctrl {
  private module:Production;

  constructor(module:Production){
    super()
    this.module = module
  }

  createProductionSchedule():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.createProductionSchedule(req.body, req.user);
        this.ok(res, 'Schedule created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  approveProductionSchedule():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.approveProductionSchedule(req.body, req.user);
        this.ok(res, 'Approved ', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchPendingProductionApprovals():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchPendingProductionApprovals(req.query, req.user);
        this.ok(res, 'Fetched pending approvals', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  viewProductionSchedule():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.viewProductionSchedule(req.params.productionId);
        this.ok(res, 'Fetched detailes', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchProductions():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchApprovedSchedules(req.query, req.user);
        this.ok(res, 'Fetched production schedules', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  markCompletedProduction():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.markCompletedProduction(req.params.productionId);
        this.ok(res, 'Production complete', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  markCompletedCylinders():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.markcompletedCylinders(req.body);
        this.ok(res, 'updated completed cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator };

export default ProductionController;
