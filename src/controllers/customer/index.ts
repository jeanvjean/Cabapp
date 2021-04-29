import { Request, Response, RequestHandler } from 'express';
import Customer from '../../modules/customers';
import Ctrl from '../ctrl';
import { uploadFile } from '../driver';
import Validator from './validator';



class customerCtrl extends Ctrl{
  private module:Customer;

  constructor(module:Customer) {
    super()
    this.module = module
  }

  createCustomer():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        let cac;
        let validId;
          //@ts-ignore
          cac = await uploadFile(req.files.CAC, 'customer-document/cac');
        //@ts-ignore
          validId = await uploadFile(req.files.validId, 'customer-document/valid-id');
        const data = await this.module.createCustomer({...req.body, CAC:cac, validID:validId});
        this.ok(res, 'Created', data);
      } catch (e) {
        this.handleError(e, req, res)
      }
    }
  }

  fetchCustomers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchCustomers(req.query);
        this.ok(res, 'Fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchCustomer():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { customerId } = req.params;
        const data = await this.module.fetchCustomerDetails(customerId);
        this.ok(res,'Fetched',data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  createOrder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { customerId } = req.params;
        //@ts-ignore
        const data = await this.module.createOrder({...req.body, customer:customerId}, req.user);
        this.ok(res, 'Created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchUserOrder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { customerId } = req.params;
        const data = await this.module.fetchCustomerOrder(customerId);
        this.ok(res, 'Fetched Orders', data)
      } catch (e) {
          this.handleError(e, req, res);
      }
    }
  }

  markOrder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { orderId } = req.params;
        const { status } = req.body;
        const data = await this.module.markOrderAsDone({orderId, status});
        this.ok(res, 'changed status', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  orderDetails():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.viewOrder(req.params.orderId);
        this.ok(res, 'order details fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  createComplaint():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { title, issue, comment } = req.body;
        const { customerId } = req.params;
        //@ts-ignore
        const data = await this.module.makeComplaint({customer:customerId, title, issue, comment});
        this.ok(res, 'complain registered', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchComplaints():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchComplaints(req.params.customerId);
        this.ok(res, 'complaints fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  updateTracking():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { orderId } = req.params;
        const data = await this.module.updateTracking({...req.body, orderId});
        this.ok(res, 'tracking updated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator }

export default customerCtrl;
