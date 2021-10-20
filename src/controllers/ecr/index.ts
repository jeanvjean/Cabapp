import { RequestHandler, Request, Response, response } from "express";
import EmptyCylinderModule from "../../modules/ecr";
import Ctrl from "../ctrl";
import Validator from './validator';



class EcrController extends Ctrl{
    private module:EmptyCylinderModule;

    constructor(module:EmptyCylinderModule){
        super();
        this.module = module;
    }

    createEcr():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.createECR(req.body, req.user);
                this.ok(res, 'ecr created', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchEcr():RequestHandler {
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.emptyCylinderPool(req.query, req.user);
                this.ok(res, 'fetched ecr', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    ecrDetails():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                const data = await this.module.fetchEcrdetails(req.params.ecrId);
                this.ok(res, 'data fetched', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    approveEcr():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.approveEcr(req.body, req.user);
                this.ok(res, 'done', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchPendingApprovals():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.fetchPendingApprovals(req.query, req.user);
                this.ok(res, 'fetched', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchEcrs():RequestHandler {
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.fetchTECR(req.query, req.user);
                this.ok(res, 'fetched ecrs', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    fetchTEcrDetails():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                const data = await this.module.fetchTEcrDetails(req.params.ecrNo)
                this.ok(res, 'details fetched', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    completeTecr():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                let { tecrId, otp } = req.params;
                //@ts-ignore
                const data = await this.module.completeTecr({tecrId, otp}, req.user);
                this.ok(res, 'approved', data);
            } catch (e) {
                this.handleError(e, req, res);
            }
        }
    }

    complaintEcr():RequestHandler{
        return async(req:Request, res:Response)=>{
            try {
                //@ts-ignore
                const data = await this.module.complaintEcr(req.query, req.user)
                this.ok(res, 'fetched', data);
            } catch (e) {
                this.handleError(e, req, res)
            }
        }
    }
}

export { Validator }

export default EcrController;