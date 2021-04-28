import { Model } from "mongoose";
import { CustomerInterface } from "../../models/customer";
import { OrderInterface } from "../../models/order";
import Module, { QueryInterface } from "../module";



export interface CustomerInterfaceProp{
  customer:Model<CustomerInterface>
  order:Model<OrderInterface>
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
  pickupType:OrderInterface['pickupType']
  pickupDate:OrderInterface['pickupDate']
  numberOfCylinders:OrderInterface['numberOfCylinders']
  customer:OrderInterface['customer']
  vehicle:OrderInterface['vehicle']
}

class Customer extends Module{
  private customer:Model<CustomerInterface>
  private order:Model<OrderInterface>

  constructor(props:CustomerInterfaceProp){
    super()
    this.customer = props.customer
    this.order = props.order
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

  public async createOrder(data:CreateOrderInterface):Promise<OrderInterface|undefined>{
    try {
      const order = await this.order.create(data);
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
      console.log(orders);
      return Promise.resolve(orders)
    } catch (e) {
      this.handleException(e)
    }
  }
}

export default Customer;
