import { Model } from "mongoose";
import { ComplaintInterface } from "../../models/complaint";
import { CustomerInterface } from "../../models/customer";
import { CylinderInterface } from "../../models/cylinder";
import { OrderInterface, PickupStatus, trackingOrder } from "../../models/order";
import { UserInterface } from "../../models/user";
import Module, { QueryInterface } from "../module";



export interface CustomerInterfaceProp{
  customer:Model<CustomerInterface>
  order:Model<OrderInterface>
  complaint:Model<ComplaintInterface>
}

interface newCustomerInterface {
  name:CustomerInterface['name']
  customerType:CustomerInterface['customerType']
  modeOfService:CustomerInterface['modeOfService']
  nickName:CustomerInterface['nickName']
  address:CustomerInterface['address']
  contactPerson:CustomerInterface['contactPerson']
  email:CustomerInterface['email']
  TIN:CustomerInterface['TIN']
  phoneNumber:CustomerInterface['phoneNumber']
  rcNumber:CustomerInterface['rcNumber']
  cylinderHoldingTime:CustomerInterface['cylinderHoldingTime']
  territory:CustomerInterface['territory']
  products:CustomerInterface['products']
  unitPrice:CustomerInterface['unitPrice']
  CAC:CustomerInterface['CAC']
  validID:CustomerInterface['validID']
}

interface CreateOrderInterface{
  pickupType?:OrderInterface['pickupType']
  pickupDate?:OrderInterface['pickupDate']
  numberOfCylinders?:OrderInterface['numberOfCylinders']
  customer:OrderInterface['customer']
  vehicle?:OrderInterface['vehicle']
  cylinderSize?:OrderInterface['cylinderSize']
  gasType?:OrderInterface['gasType']
  gasColor?:OrderInterface['gasColor']
}

type TrackingDataInput = {
  location:trackingOrder['location']
  status:trackingOrder['status']
  orderId:string
}

type NewComplainInterface = {
  customer:ComplaintInterface['customer']
  title?:ComplaintInterface['title']
  issue?:ComplaintInterface['issue']
  comment?:ComplaintInterface['comment']
}

type OrderDoneInput = {
  status:string,
  orderId:string
}

class Customer extends Module{
  private customer:Model<CustomerInterface>
  private order:Model<OrderInterface>
  private complaint:Model<ComplaintInterface>

  constructor(props:CustomerInterfaceProp){
    super()
    this.customer = props.customer
    this.order = props.order
    this.complaint = props.complaint
  }

  public async createCustomer(data:newCustomerInterface):Promise<CustomerInterface|undefined> {
    try {
      const customer = await this.customer.create({...data});
      return Promise.resolve(customer as CustomerInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomers(query:QueryInterface):Promise<CustomerInterface[]|undefined>{
    try {
      const customers = await this.customer.find(query);
      return Promise.resolve(customers);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchCustomerDetails(id:string):Promise<CustomerInterface|undefined>{
    try {
      const customer = await this.customer.findById(id);
      return Promise.resolve(customer as CustomerInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async createOrder(data:CreateOrderInterface, user:UserInterface):Promise<OrderInterface|undefined>{
    try {
      const order = new this.order(data);
      order.tracking.push({
        location:user.role,
        status:'pending'
      });
      return Promise.resolve(order);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomerOrder(customerId:string):Promise<OrderInterface[]|undefined>{
    try {
      //@ts-ignore
      const orders = await this.order.find({customer:`${customerId}`}).populate([
        {path:'customer', model:'customer'},
        {path:'vehicle', model:'vehicle'}
      ]);
      return Promise.resolve(orders)
    } catch (e) {
      this.handleException(e)
    }
  }

  public async markOrderAsDone(data:OrderDoneInput ):Promise<OrderInterface|undefined>{
    try {
      const order = await this.order.findById(data.orderId);
      if(data.status == PickupStatus.DONE) {
        //@ts-ignore
        order?.status = PickupStatus.DONE
      }else if(data.status == PickupStatus.PENDING){
        //@ts-ignore
        order?.status = PickupStatus.PENDING;
      }
      await order?.save();
      return Promise.resolve(order as OrderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async updateTracking(data:TrackingDataInput):Promise<OrderInterface|undefined>{
    try {
      const order = await this.order.findById(data.orderId);
      //@ts-ignore
      order?.status = data.status;
      //@ts-ignore
      order.location = data.location;
      //@ts-ignore
      await order.save()
      return Promise.resolve(order as OrderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async viewOrder(orderId:string):Promise<OrderInterface|undefined>{
    try {
      const order = await this.order.findById(orderId);
      return Promise.resolve(order as OrderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async makeComplaint(data:NewComplainInterface):Promise<ComplaintInterface|undefined>{
    try {
      const complain = await this.complaint.create(data);
      return Promise.resolve(complain);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchComplaints(customerId:string):Promise<ComplaintInterface[]|undefined>{
    try {
      //@ts-ignore
      const complains = await this.complaint.find({customer:customerId});
      return Promise.resolve(complains);
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Customer;
