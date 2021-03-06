/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable require-jsdoc */
import {Request, Response, RequestHandler} from 'express';
import Customer from '../../modules/customers';
import Ctrl from '../ctrl';
import {uploadFile} from '../driver';
import Validator from './validator';


class customerCtrl extends Ctrl {
  private module: Customer;

  constructor(module: Customer) {
    super();
    this.module = module;
  }

  createCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        let cac;
        let validId;
        if (req.files) {
          // @ts-ignore
          cac = await uploadFile(req.files.CAC, 'customer-document/cac');
          // @ts-ignore
          validId = await uploadFile(req.files.validId, 'customer-document/valid-id');
        }
        // @ts-ignore
        const data = await this.module.createCustomer({...req.body, CAC: cac, validID: validId}, req.user);
        this.ok(res, 'Created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCustomers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchCustomers(req.query, req.user);
        this.ok(res, 'Fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {customerId} = req.params;
        const data = await this.module.fetchCustomerDetails(customerId);
        this.ok(res, 'Fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  deleteCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {customerId} = req.params;
        const {reason} = req.query;
        // @ts-ignore
        const data = await this.module.deleteACustomer(customerId, req.user, reason);
        this.ok(res, data.message, data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchDeletedCustomers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchDeletedCustomers(req.query, req.user);
        this.ok(res, 'deleted customers', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  createOrder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.createOrder({...req.body}, req.user);
        this.ok(res, 'Created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchUserOrder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {customerId} = req.params;
        // @ts-ignore
        const data = await this.module.fetchCustomerOrder(req.query, customerId);
        this.ok(res, 'Fetched Orders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  markOrder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {orderId} = req.params;
        const {status} = req.body;
        // @ts-ignore
        const data = await this.module.markOrderAsDone({orderId, status}, req.user);
        this.ok(res, 'changed status', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  orderDetails(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.viewOrder(req.params.orderId);
        this.ok(res, 'order details fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  deletePickupOrder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.deletePickupOrder(req.params.orderId);
        this.ok(res, `${data.message}`);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  assignOrderToVehicle(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.assignOrderToVehicle({...req.body, orderId: req.params.orderId}, req.user);
        this.ok(res, 'order assigned to vehicle', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCreatedOrders(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchAllOrders(req.query, req.user);
        this.ok(res, 'fetched all orders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchallCustomers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchAllCustomers(req.user);
        this.ok(res, 'customers fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchOrdersForVehicle(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchOrdersAssignedToVehicle(req.query, {vehicle: req.params.vehicleId});
        this.ok(res, 'orders fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchComplaintDetails(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.complaintsDetails(req.params.complaintId);
        this.ok(res, 'complaint details', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  createComplaint(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {title, issue, comment} = req.body;
        const {customerId} = req.params;
        // @ts-ignore
        const data = await this.module.makeComplaint({...req.body}, req.user);
        this.ok(res, 'complain registered', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  approveComplaint(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {complaintId} = req.params;
        // @ts-ignore
        const data = await this.module.approveComplaint({...req.body}, req.user);
        this.ok(res, 'Approval status updated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchComplaints(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchComplaints(req.query, req.user);
        this.ok(res, 'complaints fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchPendingComplaintApproval(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchUserComplaintApproval(req.query, req.user);
        this.ok(res, 'pending approvals fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchApprovedComplaints(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchApprovedComplaints(req.query, req.user);
        this.ok(res, 'complaints fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  updateTracking(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {orderId} = req.params;
        const data = await this.module.updateTracking({...req.body, orderId});
        this.ok(res, 'tracking updated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  resolveComplaint(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.resolveComplaint(req.params.complaintId, req.user);
        this.ok(res, 'Complaint resolved', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  registerWalkinCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.registerWalkinCustomers(req.body, req.user);
        this.ok(res, 'customer registered', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  updateWalkinCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.updateWalkinCustomer(req.params.customerId, req.body, req.user);
        this.ok(res, 'completed registeration', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchWalkinCustomers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchWalkinCustomers(req.query, req.user);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchWalkinCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.fetchWalkinCustomer(req.params.icnNo);
        this.ok(res, 'customer fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  markCustomerAsFilled(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.markFilledCustomer(req.params.customerId);
        this.ok(res, 'marked as full', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  deleteWalkinCustomer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.deleteWalkinCustomer(req.params.customerId, req.user);
        this.ok(res, 'customer deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchFilledCustomerCylinders(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchFilledCustomerCylinders(req.query, req.user);
        this.ok(res, 'Filled cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchOrderHistory(): RequestHandler {
    return async (req: Request, res: Response)=> {
      try {
        // @ts-ignore
        const data = await this.module.customerOrderHistory(req.query, req.user);
        this.ok(res, 'order hist', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }
}

export {Validator};

export default customerCtrl;
