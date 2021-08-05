import Ctrl from "../ctrl";
import OcnModule from '../../modules/ocn';
import { RequestHandler, Response, Request } from "express";
import Validator from './validator';


class ocnController extends Ctrl {
    private module:OcnModule;

    constructor(module:OcnModule) {
        super()
        this.module = module
    }

    recordOcn():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.createOCNRecord(req.body, req.user);
                this.ok(res, 'record created', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    approveOcn():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.approveOcn({...req.body, ocnId:req.params.ocnId}, req.user);
                this.ok(res, `approval ${data?.approvalStage} done`,data );
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchOcnApprovals():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.fetchOcnApprovals(req.query,req.user);
                this.ok(res, 'fetched pending approvals', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchOcnDetails():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                const data = await this.module.viewOcnDetails(req.params.ocnId);
                this.ok(res, 'fetched details', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    updateOcn():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.updateOcn(req.params.ocnId, req.body, req.user);
                this.ok(res, 'done', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchOcns():RequestHandler{
      return async(req:Request, res:Response) =>{
        try {
          //@ts-ignore
          const data = await this.module.fetchOcns(req.query, req.user);
          this.ok(res, 'fetched ocns', data);
        } catch (e) {
          this.handleError(e, req, res);
        }
      }
    }
}

export { Validator };

export default ocnController;
