import { Request, Response, RequestHandler } from 'express';
import Product from '../../modules/inventory';
import Ctrl from '../ctrl';
import Validator from './validation';


class ProductCtrl extends Ctrl{
  private module: Product;

  constructor(props:Product) {
    super()
    this.module = props
  }

  createProduct():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        //@ts-ignore
        const data = await this.module.createProduct(req.body, req.user);
        this.ok(res,'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchProducts():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const products = await this.module.fetchProducts(req.query, req.user);
        this.ok(res, 'ok', products);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchProduct():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { id } = req.params;
        //@ts-ignore
        const product = await this.module.fetchProduct(id, req.user);
        this.ok(res, 'ok', product);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  createSupplier():RequestHandler{
    return async (req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const supplier = await this.module.createSupplier(req.body, req.user);
        this.ok(res, 'ok', supplier);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  addInventory():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const inventory = await this.module.addInventory(req.body);
        this.ok(res, 'ok', inventory);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  disburseProducts():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const disbursement = await this.module.disburseProduct(req.body, req.user);
        this.ok(res, 'ok', disbursement);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  approveDisbursement():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.approveDisbursment(req.body, req.user);
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDisburseApprovals():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const disbursements = await this.module.fetchusersDisburseApprovals(req.query, req.user);
        this.ok(res, 'ok', disbursements)
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDisbursement():RequestHandler{
    return async(req:Request, res:Response)=> {
      try {
        const disbursement  = await this.module.fetchDisbursement(req.params.id);
        this.ok(res,'ok',disbursement);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDisbursements():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        const disbursement = await this.module.fetchDisburseRequests(req.query);
        this.ok(res, 'ok', disbursement);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator }

export default ProductCtrl;
