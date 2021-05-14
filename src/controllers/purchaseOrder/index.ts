import Ctrl from "../ctrl";
import PurchaseOrder from '../../modules/purchaseOrder';
import { RequestHandler, Request, Response } from "express";
import Validator from './validator';



class PurchaseOrderCtrl extends Ctrl {
    private module:PurchaseOrder;

    constructor(module:PurchaseOrder) {
        super()
        this.module = module
    }

    createPurchserOrder():RequestHandler{
        return async(req: Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.createPurchaseOrder(req.body, req.user);
                this.ok(res, 'created purchase order', data)
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchPurchases():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.fetchPurchaseOrders(req.query, req.user);
                this.ok(res, 'fetched purchase orders', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    approvePurchaseOrder():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                const { purchaseId } = req.params;
                //@ts-ignore
                const data = await this.module.approvePurchaseOrder({...req.body, purchaseId}, req.user);
                this.ok(res,'approved purchase order', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchPurchaseApprovals():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.fetchPurchaseOrderRequests(req.query, req.user);
                this.ok(res, 'purchase order requests fetched', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    viewOrderDetails():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                const data = await this.module.fetchOrderDetails(req.params.orderId);
                this.ok(res, 'Order details fetched', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }
}

export { Validator };

export default PurchaseOrderCtrl;