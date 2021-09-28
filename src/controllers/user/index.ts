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
import { uploadFile } from '../driver';
const permissions = require('../../util/permissions.json');


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
        this.ok(res,'Registered successfully', user);
      } catch (error) {
        this.handleError(error, req, res)
      }
    }
  }

  registerSupremeUser(): RequestHandler{
    return async(req:Request, res:Response): Promise<void> => {
      try {
        const { body } = req;
        const user:UserInterface | undefined = await this.module.register(body);
        this.ok(res,'Registered successfully', user);
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
        this.ok(res, 'Invitation sent', data);
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
        this.ok(res, 'Fetched successfully', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchUsers(): RequestHandler{
    return async (req:Request, res:Response) =>{
      try {
        //@ts-ignore
        const data = await this.module.fetchUsers({...req.query}, req.user);
        this.ok(res, 'Fetched Users', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  branchUsers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.branchUsers({...req.query}, req.user);
        this.ok(res, 'branch users', data);
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
        this.ok(res, 'User details', user);
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
        this.ok(res, 'Login successful', user);
      } catch (error) {
        this.handleError(error, req, res)
      }
    }
  }

  updateUser():RequestHandler{
    return async(req:Request, res:Response) =>{
      //Todo: implement update function
      try {
        let image;
        if(req.files){
          //@ts-ignore
          image = await uploadFile(req.files.image, 'profile_image/');
        }
        //@ts-ignore
        const data: UserInterface | undefined = await this.module.updateUser({...req.body, image}, req.user);
        this.ok(res, 'Updated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  changeUserRole():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { userId } = req.params;
        //@ts-ignore
        const data = await this.module.changeUserRole({...req.body,userId}, req.user);
        this.ok(res, 'updated user role',data );
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  suspendUser():RequestHandler{
    return async(req:Request, res:Response)=>{
      try{
        const { userId } = req.params;
        let { suspend, reason } = req.query;
        //@ts-ignore
        const data = await this.module.suspendUser({userId, suspend, reason}, req.user);
        this.ok(res, data?.message, data?.user);
      }catch(e){
        this.handleError(e, req, res);
      }
    }
  }

  requestPasswordReset():RequestHandler{
    return async (req:Request, res:Response)=>{
      try {
        const data = await this.module.requestPasswordReset(req.body);
        this.ok(res,'A link has been sent to your email',data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  resetPassword():RequestHandler{
    return async (req:Request, res:Response)=>{
      try {
        const data = await this.module.resetPassword(req.body);
        this.ok(res, 'Password changed', data);
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
        this.ok(res,'Password changed',data);
      } catch (e) {
        this.handleError(e, req, res)
      }
    }
  }

  deleteUser():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        const { reason } = req.query;
        //@ts-ignore
        const data = await this.module.deleteUser(req.params.userId, reason, req.user);
        this.ok(res,'Deleted',data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDeletedUsers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchDeletedUsers(req.query, req.user);
        this.ok(res, 'fetched deleted users', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  userStatistics():RequestHandler {
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.userStatistics(req.user);
        this.ok(res, 'stats fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchPermissions():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = permissions.permissions;
        this.ok(res, 'permissions fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  updateToken():RequestHandler{
    return async(req:Request, res:Response)=>{
      try{
        //@ts-ignore
        const user = req.user;
        // console.log(user);
        const { token } = req.params;
        const data = await this.module.updateToken(user._id.toString(), token);
        this.ok(res, 'Token saved', data);
      }catch(e){
        this.handleError(e, req, res);
      }
    }
  }

  fetchallUsers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchallUsers();
        this.ok(res, 'all users fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }
}

export {Validator}

export default UserController;


