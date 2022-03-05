/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable require-jsdoc */
import Ctrl from '../ctrl';
import Account from '../../modules/account';
import Validator from './validator';
import {RequestHandler, Response, Request} from 'express';

class accountController extends Ctrl {
    private module: Account;

    constructor(module: Account) {
      super();
      this.module = module;
    }

    createInvoice(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          // @ts-ignore
          const data = await this.module.createReciept(req.body, req.user);
          this.ok(res, 'invoice created', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    fetchInvoices(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          // @ts-ignore
          const data = await this.module.fetchInvoices(req.query, req.user);
          this.ok(res, 'invoices fetched', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    fetchInvoiceDetails(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          const data = await this.module.viewInvoiceDetails(req.params.invoiceId);
          this.ok(res, 'Invoice details', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    updateInvoice(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          const {invoiceId} = req.params;
          const data = await this.module.updateInvoice({invoiceId, update: {...req.body}});
          this.ok(res, `${data?.message}`, data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }
}

export {Validator};

export default accountController;
