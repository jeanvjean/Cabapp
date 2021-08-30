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
        const data = await this.module.fetchPendingRequisitionApproval(req.query, req.user);
        this.ok(res, 'fetched pending approvals', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  returnedCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.returnedCylinder(req.params.cylinderId);
        this.ok(res, 'cylinder has been returned', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  salesReportCylinders():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.cylinderTransactions(req.user);
        this.ok(res, 'cylinder report fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  salesOrderReport():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.salesOrderTransaction(req.query, req.user);
        this.ok(res, 'sales order report', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  purchaseOrderReport():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.purchaseOrderReport(req.query, req.user);
        this.ok(res, 'purchase order report', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  purchaseReportDowndload():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.purchaseReportDowndload(req.user);
        this.ok(res, 'download data', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  salesOrderDownload():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.salesOrderDownload(req.user);
        this.ok(res, 'sales order report', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  salesReportCylindersDownload():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.cylinderTransactionsDownload(req.user);
        this.ok(res, 'cylinder report fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator };

export default SalesCtrl;
