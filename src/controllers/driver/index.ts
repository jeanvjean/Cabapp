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
          this.ok(res, 'ok', data);
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
        this.ok(res, 'ok', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

  fetchDrivers():RequestHandler{
    return async(req:Request, res:Response)=>{
      try {
        const data = await this.module.fetchDrivers(req.query);
        this.ok(res,'ok',data);
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
        this.ok(res, 'ok', driver);
      } catch (e) {
        this.handleError(e, req, res);
      }
    }
  }

}
export const uploadFile = async(files:object, filePath:string)=>{
  //@ts-ignore
  files = files.file
  let path = './temp'
  if (!existsSync(path)) {
    mkdirSync(path)
  }
  if (Array.isArray(files)) {
    let images = []
    for (let file of files) {
      //@ts-ignore
      await file.mv(path + '/' + file.name)
      let uploader = new Uploader()
      //@ts-ignore
      let url = await uploader.upload(path + '/' + file.name, filePath,{});
      images.push(url)
      //@ts-ignore
      unlinkSync(path + '/' + file.name)
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
