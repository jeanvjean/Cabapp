import {
  Request,
  Response,
  RequestHandler
} from 'express';
import Cylinder from '../../modules/cylinder';
import Ctrl from '../ctrl';
import Validator from './validator';



class CylinderController extends Ctrl{
  private module: Cylinder;

  constructor(module:Cylinder) {
    super(),
    this.module = module;
  }


  createCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        let cylinder = await this.module.createCylinder(req.body, req.user);
        this.ok(res, 'Created', cylinder);
      } catch (e) {
        this.handleError(e, req, res)
      }
    }
  }

  fetchCylinders():RequestHandler{
    return async (req:Request, res:Response) =>{
      try {
        const list = await this.module.fetchCylinders(req.query);
        this.ok(res, 'fetched cylinder types', list);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  cylinderDetails():RequestHandler{
    return async(req:Request,res:Response)=> {
      try {
        const {id} = req.params
        const cylinder = await this.module.cylinderDetails(id);
        this.ok(res,'Cylinder type',cylinder);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  registerCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.regCylinder(req.body, req.user);
        this.ok(res, 'Registered', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchRegisteredCylinders(): RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchRegisteredCylinders(req.query, req.user);;
        this.ok(res, 'fetched', data)
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchRegisteredCylinder():RequestHandler{
    return async (req:Request, res:Response)=>{
      try {
        const { id } = req.params;
        //@ts-ignore
        const cylinder = await this.module.fetchRegisteredCylinder(id, req.user);
        this.ok(res, 'Fetched details', cylinder);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  transferCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const transfer = await this.module.transferCylinders(req.body, req.user);
        this.ok(res, 'Transfer Initiated', transfer);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  approveTransfer():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const approval = await this.module.approveTransfer(req.body, req.user);
        this.ok(res, 'Approved', approval);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchTransferRequests():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        const transfers = await this.module.fetchTransferRequets(req.query);
        this.ok(res, 'fetched', transfers);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchTransferDetails():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchTransferDetails(req.params.id);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  usersPendingApprovals():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchUserPendingApproval(req.query, req.user);
        this.ok(res, 'Pending approvals fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  deleteRegisteredCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { cylinderId } = req.params;
        //@ts-ignore
        const data = await this.module.deleteRegisteredCylinder(cylinderId, req.user);
        this.ok(res,'Deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchFaultyCylinders():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchFaultyCylinders(req.query);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchCustomerCylinders():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchCustomerCylinders(req.params.customerId);
        this.ok(res, 'fetched cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchCompletedTransfers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchTransferReport(req.query);
        this.ok(res, 'transfer report fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  faultyCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.faultyCylinder(req.params.cylinderId);
        this.ok(res,'cylinder marked as faulty', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  condemnCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.condemnCylinder(req.params.cylinderId);
        this.ok(res,'archived cylinder', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchCondemnCylinders():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchArchivedCylinder(req.query);
        this.ok(res,'archive fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fixFaultyCylinder():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fixedFaultyCylinder(req.params.cylinderId);
        this.ok(res,'cylinder fixed', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator }

export default CylinderController;
