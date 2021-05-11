import Ctrl from "../ctrl";
import Sales from '../../modules/sales';
import { RequestHandler, Request, Response } from "express";
import Validator from './validator';


class SalesCtrl extends Ctrl{
  private module:Sales

  constructor(module:Sales){
    super()
    this.module = module;
  }

  createSalesReq():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.createSalesRequisition(req.body, req.user);
        this.ok(res,'created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchSalesReq():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchSalesRequisition(req.query, req.user);
        this.ok(res,'fetched requisitions', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchRequisitionDetails():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchSalesReqDetails(req.params.salesId);
        this.ok(res, 'Details fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  approveSalesRequisition():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.approveSalesRequisition(req.body, req.user);
        this.ok(res, 'approved', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchPendingSaleRequisition():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchPendingRequisitionApproval(req.user);
        this.ok(res, 'fetched pending approvals', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator };

export default SalesCtrl;