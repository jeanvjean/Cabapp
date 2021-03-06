/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import {Request, Response, RequestHandler} from 'express';
import Scan from '../../modules/scan';
import Ctrl from '../ctrl';
import Validator from './validation';


class ScanController extends Ctrl {
    private module: Scan

    constructor(module: Scan) {
      super(),
      this.module = module;
    }

    startScan(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          // @ts-ignore
          const data = await this.module.ScanCylinder(req.query);
          this.ok(res, 'scanning', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    initiateScan(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          const data = await this.module.initiateScan();
          this.ok(res, 'scan started', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    fetchScans(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          // @ts-ignore
          const data = await this.module.fetchScans(req.query);
          this.ok(res, 'all scans', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    scanInfo(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          const data = await this.module.scanInfo(req.params.formId);
          this.ok(res, 'scan info', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    complete(): RequestHandler {
      return async (req: Request, res: Response)=>{
        try {
          const data = await this.module.complete(req.params.formId);
          this.ok(res, 'scan complete', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }

    update(): RequestHandler {
      return async (req: Request, res: Response)=> {
        try {
          const data = await this.module.updateCyliderScan(req.body);
          this.ok(res, 'update', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      };
    }
}

export {Validator};

export default ScanController;
