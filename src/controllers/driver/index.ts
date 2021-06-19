import { RequestHandler, Response, Request } from 'express';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import Driver from '../../modules/driver';
import Uploader from '../../util/uploader';
import Ctrl from '../ctrl';



class driverCtrl extends Ctrl{
  private module:Driver

  constructor(module:Driver) {
    super()
    this.module = module
  }

  createDriver():RequestHandler{
    return async(req:Request,res:Response)=>{
      try {
          let image = await uploadFile(req.files, 'profile_image/');
          const data = await this.module.createDriver({...req.body, image});
          this.ok(res, 'Created', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  deleteDriver():RequestHandler{
    return async(req:Request, res:Response) =>{
      try {
        const { driverId } = req.params;
        const data = await this.module.deleteDriver({driverId});
        this.ok(res, 'Deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDrivers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchDrivers(req.query, req.user);
        this.ok(res,'Fetched',data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDriver():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const { driverId } = req.params
        const driver = await this.module.fetchDriver({driverId});
        this.ok(res, 'details fetched', driver);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchallDrivers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        //@ts-ignore
        const data = await this.module.fetchallDrivers(req.query, req.user);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}
export const uploadFile = async(file:object, filePath:string)=>{
  //@ts-ignore
  const files = file
  let path = './temp'
  if (!existsSync(path)) {
    mkdirSync(path)
  }
  if (Array.isArray(files)) {
    let images = []
    for (let f of files) {
      //@ts-ignore
      await f.mv(path + '/' + f.name)
      let uploader = new Uploader()
      //@ts-ignore
      let url = await uploader.upload(path + '/' + f.name, filePath,{});
      images.push(url)
      //@ts-ignore
      unlinkSync(path + '/' + f.name)
    }
    // res.send({images, message: 'files uploaded'})
    return images
  } else {
    //@ts-ignore
    await files.mv(path + '/' + files.name)
    let uploader = new Uploader()
    //@ts-ignore
    let url = await uploader.upload(path + '/' + files.name, filePath, {})
    //@ts-ignore
    unlinkSync(path + '/' + files.name)
    // res.send({image: url, message: 'file uploaded'})
    return url
  }
}

export default driverCtrl;
