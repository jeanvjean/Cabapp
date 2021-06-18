import { Request, Response, RequestHandler } from 'express';
import { pathExists } from 'fs-extra';
import Product from '../../modules/inventory';
import Ctrl from '../ctrl';
import { uploadFile } from '../driver';
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
        this.ok(res,'Products created', data);
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
        this.ok(res, 'fetched', products);
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
        this.ok(res, 'details fetched', product);
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
        this.ok(res, 'supplier added', supplier);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  addInventory():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        let grnDocument
        if(req.files) {
          //@ts-ignore
          grnDocument = await uploadFile(req.files.grnDocument, 'inventory/grn-docs');
        }
        //@ts-ignore
        const inventory = await this.module.addInventory({...req.body, grnDocument}, req.user);
        this.ok(res, 'Inventory registered', inventory);
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
        this.ok(res, 'done', disbursement);
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
        this.ok(res, 'Approved', data);
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
        this.ok(res, 'Fetched', disbursements)
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDisbursement():RequestHandler{
    return async(req:Request, res:Response)=> {
      try {
        const disbursement  = await this.module.fetchDisbursement(req.params.id);
        this.ok(res,'Details fetched',disbursement);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDisbursements():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        //@ts-ignore
        const disbursement = await this.module.fetchDisburseRequests(req.query, req.user);
        this.ok(res, 'Fetched', disbursement);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  disburseReport():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        //@ts-ignore
        const data = await this.module.disburseReport(req.query, req.user);
        this.ok(res, 'disburse report fetched successfully', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchUserDisburseRequests():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const disbursements = await this.module.fetchusersDisburseRequests(req.query, req.user);
        this.ok(res, 'Fetched', disbursements)
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  createBranch():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.createBranch(req.body);
        this.ok(res, 'branch created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchBranches():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data =  await this.module.fetchBranches(req.query);
        this.ok(res,'branches returned', data)
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchSuppliers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchSuppliers(req.query, req.user);
        this.ok(res,'suppliers fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  updateSupplier():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { supplierId } = req.params;
        const data = await this.module.updateSupplier(supplierId, req.body);
        this.ok(res, 'updated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  deleteSupplier():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.removeSupplier(req.params.supplierId);
        this.ok(res,'Deleted',data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  deleteProduct():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.deleteProduct(req.params.productId);
        this.ok(res,'Product deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  updateProduct():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { productId } = req.params
        const data = this.module.updateProduct(productId, {...req.body});
        this.ok(res, 'product updated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchProductsRequest():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchProductRequests(req.query, req.user);
        this.ok(res, 'all restock requests fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchInventories():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchInventories(req.query, req.user);
        this.ok(res, 'inventories retrieved', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchInventoryDetail():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.viewInventory(req.params.inventoryId);
        this.ok(res, 'details fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  inventoryStats():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.inventoryStats(req.user);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}

export { Validator }

export default ProductCtrl;
