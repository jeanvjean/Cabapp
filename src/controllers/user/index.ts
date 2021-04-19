import {
  Request,
  Response,
  RequestHandler
} from 'express';
import User from '../../modules/user';
import Ctrl from '../ctrl';
import { UserInterface } from '../../models/user';
import Validator from './validator';
import uploader from '../../util/uploader';


class UserController extends Ctrl{
  private module:User;

  constructor(module:User) {
    super();
    this.module = module;
  }

  create(): RequestHandler{
    return async(req:Request, res:Response): Promise<void> => {
      try {
        const { body } = req;
        const user:UserInterface | undefined = await this.module.register(body);
        this.ok(res,'ok', user);
      } catch (error) {
        this.handleError(error, req, res)
      }
    }
  }

  inviteUser():RequestHandler{
    return async(req:Request, res:Response)=> {
      try {
        const { body } = req;
        //@ts-ignore
        const data = await this.module.inviteUser(body, req.user);
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res)
      }
    }
  }

  getConstantRoles():RequestHandler{
    return async (req:Request, res: Response) =>{
      try {
        //@ts-ignore
        const data = await this.module.fetchRoles(req.user);
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchUsers(): RequestHandler{
    return async (req:Request, res:Response) =>{
      try {
        //@ts-ignore
        const data = await this.module.fetchUsers(req.query, req.user);
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchUser(): RequestHandler{
    return async (req:Request, res: Response)=>{
      try{
        //@ts-ignore
        const user:UserInterface | undefined = await this.module.fetchUser(req.params);
        this.ok(res, 'ok', user);
      }catch(e){
        this.handleError(e, req, res);
      }
    }
  }

  login():RequestHandler {
    return async (req:Request, res:Response)=> {
      try {
        const {body} = req;
        const user = await this.module.login(body);
        this.ok(res, 'ok', user);
      } catch (error) {
        this.handleError(error, req, res)
      }
    }
  }

  updateUser():RequestHandler{
    return async(req:Request, res:Response) =>{
      //Todo: implement update function
      try {
        //@ts-ignore
        const data: UserInterface | undefined = await this.module.updateUser(req.body, req.user);
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  requestPasswordReset():RequestHandler{
    return async (req:Request, res:Response)=>{
      try {
        const data = await this.module.requestPasswordReset(req.body);
        this.ok(res,'ok',data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  resetPassword():RequestHandler{
    return async (req:Request, res:Response)=>{
      try {
        const data = await this.module.resetPassword(req.body);
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  changePassword():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        //@ts-ignore
        const data = await this.module.changePassword(req.body, req.user);
        this.ok(res,'ok',data);
      } catch (e) {
        this.handleError(e, req, res)
      }
    }
  }
}

export {Validator}

export default UserController;


