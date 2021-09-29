import Module, { QueryInterface } from "../module";
import { Model } from "mongoose";
import { DriverInterface } from "../../models/driver";
import { BadInputFormatException } from "../../exceptions";
import { UserInterface } from "../../models/user";

interface DriverPropInterface {
  driver:Model<UserInterface>
}

interface NewDriverInterface {
  name:DriverInterface['name']
  address:DriverInterface['address']
  email:DriverInterface['email']
  qualification:DriverInterface['qualification']
  image?:DriverInterface['image']
  age:DriverInterface['age']
  height:DriverInterface['height']
}

type Parameters ={
  driverId?:string
}

type DeleteResponse = {
  message:string
}


class Driver extends Module{
  private driver:Model<UserInterface>

  constructor(props:DriverPropInterface) {
    super()
    this.driver = props.driver
  }

  public async createDriver(data:NewDriverInterface):Promise<UserInterface|undefined>{
    try {
      const driverExists = await this.driver.findOne({email:data.email});
      if(driverExists) {
        throw new BadInputFormatException('A driver already exists with this email');
      }
      const driver = await this.driver.create(data);
      return Promise.resolve(driver);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async deleteDriver(data:Parameters):Promise<DeleteResponse|undefined>{
    try {
      const driver = await this.driver.findById(data.driverId);
      if(!driver) {
        throw new BadInputFormatException('this driver no longer exist');
      }
      await this.driver.findByIdAndDelete(data.driverId);
      return Promise.resolve({
        message:'Driver deleted'
      })
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDrivers(query:QueryInterface, user:UserInterface):Promise<UserInterface[]|undefined>{
    try {
      let { search, name, email } = query;
      const options = {
        page:query.page,
        limit:query.limit,
        populate:[
          {path:'vehicle', model:'vehicle'}
        ]
      }
      let q={
        branch:user.branch,
        subrole:'driver'
      }
      let or = []

      if(name) {
        //@ts-ignore
        q = {...q, name:name}
      }
      if(email) {
        //@ts-ignore
        q = {...q, email:email}
      }
      //@ts-ignore
      const users = await this.driver.paginate(q,options);
      return Promise.resolve(users);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchallDrivers(query:QueryInterface, user:UserInterface):Promise<UserInterface[]|undefined>{
    try {
      const drivers = await this.driver.find({branch:user.branch ,subrole:'driver'});
      return Promise.resolve(drivers);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDriver(data:Parameters):Promise<UserInterface|undefined>{
    try {
      const driver = await this.driver.findById(data.driverId).populate(
        {path:'vehicle', model:'vehicle'}
      );
      return Promise.resolve(driver as UserInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

}

export default Driver;
