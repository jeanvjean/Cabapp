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
        console.log(cylinder);
        this.ok(res, 'ok', cylinder);
      } catch (e) {
        this.handleError(e, req, res)
      }
    }
  }

  fetchCylinders():RequestHandler{
    return async (req:Request, res:Response) =>{
      try {
        const list = await this.module.fetchCylinders(req.query);
        this.ok(res, 'ok', list);
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
        this.ok(res,'ok',cylinder);
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
        this.ok(res, 'ok', data);
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
        this.ok(res, 'ok', data)
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
        this.ok(res, 'ok', cylinder);
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
        this.ok(res, 'ok', transfer);
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
        this.ok(res, 'ok', approval);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchTransferRequests():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        const transfers = await this.module.fetchTransferRequets(req.query);
        this.ok(res, 'ok', transfers);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchTransferDetails():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchTransferDetails(req.params.id);
        this.ok(res, 'ok', data);
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
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator }

export default CylinderController;
