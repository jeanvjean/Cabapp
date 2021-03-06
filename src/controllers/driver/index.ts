/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable require-jsdoc */
import {RequestHandler, Response, Request} from 'express';
import {existsSync, mkdirSync, unlinkSync} from 'fs';
import Driver from '../../modules/driver';
import Uploader from '../../util/uploader';
import Ctrl from '../ctrl';


class driverCtrl extends Ctrl {
  private module: Driver

  constructor(module: Driver) {
    super();
    this.module = module;
  }

  createDriver(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const image = await uploadFile(req.files, 'profile_image/');
        const data = await this.module.createDriver({...req.body, image});
        this.ok(res, 'Created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  deleteDriver(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        const {driverId} = req.params;
        const data = await this.module.deleteDriver({driverId});
        this.ok(res, 'Deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchDrivers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchDrivers(req.query, req.user);
        this.ok(res, 'Fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchDriver(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {driverId} = req.params;
        const driver = await this.module.fetchDriver({driverId});
        this.ok(res, 'details fetched', driver);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchallDrivers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchallDrivers(req.query, req.user);
        this.ok(res, 'drivers fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }
}
export const uploadFile = async (file: object, filePath: string)=>{
  // @ts-ignore
  const files = file;
  const path = './temp';
  if (!existsSync(path)) {
    mkdirSync(path);
  }
  if (Array.isArray(files)) {
    const images = [];
    for (const f of files) {
      // @ts-ignore
      await f.mv(path + '/' + f.name);
      const uploader = new Uploader();
      // @ts-ignore
      const url = await uploader.upload(path + '/' + f.name, filePath, {});
      images.push(url);
      // @ts-ignore
      unlinkSync(path + '/' + f.name);
    }
    // res.send({images, message: 'files uploaded'})
    return images;
  } else {
    // @ts-ignore
    await files.mv(path + '/' + files.name);
    const uploader = new Uploader();
    // @ts-ignore
    const url = await uploader.upload(path + '/' + files.name, filePath, {});
    // @ts-ignore
    unlinkSync(path + '/' + files.name);
    // res.send({image: url, message: 'file uploaded'})
    return url;
  }
};

export default driverCtrl;
