import { Model, Schema } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ComplaintInterface, complaintStatus } from "../../models/complaint";
import { CustomerInterface } from "../../models/customer";
import { OrderInterface, PickupStatus, pickupType, trackingOrder } from "../../models/order";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { WalkinCustomerInterface, WalkinCustomerStatus } from "../../models/walk-in-customers";
import { ApprovalInput, mongoose } from "../cylinder";
import Module, { QueryInterface } from "../module";
import Notify from '../../util/mail';
import env from '../../configs/static';
import { createLog } from "../../util/logs";
import { generateToken, padLeft } from "../../util/token";
import { BranchInterface } from "../../models/branch";
import { ProductInterface } from "../../models/inventory";
import { VehicleInterface } from "../../models/vehicle";
import { SupplierInterface } from "../../models/supplier";
import { CylinderInterface } from "../../models/cylinder";



export interface CustomerInterfaceProp{
  customer:Model<CustomerInterface>
  order:Model<OrderInterface>
  complaint:Model<ComplaintInterface>
  user:Model<UserInterface>
  walkin:Model<WalkinCustomerInterface>
  branch:Model<BranchInterface>
  product:Model<ProductInterface>
  vehicle:Model<VehicleInterface>
  supplier:Model<SupplierInterface>
  cylinder:Model<CylinderInterface>
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
  cylinderHoldingTime:number
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
  supplier?:OrderInterface['supplier']
  vehicle?:OrderInterface['vehicle']
  cylinderSize?:OrderInterface['cylinderSize']
  gasType?:OrderInterface['gasType']
  gasColor?:OrderInterface['gasColor']
  orderType:OrderInterface['orderType']
}

type TrackingDataInput = {
  location:trackingOrder['location']
  status:trackingOrder['status']
  orderId:string
}

type OrderAssignVehicle = {
  orderId:string,
  vehicle:OrderInterface['vehicle']
}

type NewComplainInterface = {
  customer:ComplaintInterface['customer'],
  complaintType?:ComplaintInterface['complaintType']
  title?:ComplaintInterface['title']
  issue?:ComplaintInterface['issue']
  comment?:ComplaintInterface['comment']
  cylinders?:ComplaintInterface['cylinders'],
  replaceCylinder?:ComplaintInterface['replaceCylinder']
  aprovalOfficers?:ComplaintInterface['nextApprovalOfficer']
  nextApprovalOfficer?:ComplaintInterface['nextApprovalOfficer']
  additionalAction?:ComplaintInterface['additionalAction']
}

type newWalkinCustomer = {
  customerName:WalkinCustomerInterface['customerName']
  ercNo:WalkinCustomerInterface['ercNo']
  cylinders:WalkinCustomerInterface['cylinders']
  orderType:WalkinCustomerInterface['orderType']
  date:WalkinCustomerInterface['date']
  icnNo:WalkinCustomerInterface['icnNo']
  modeOfService:WalkinCustomerInterface['modeOfService']
  serialNo?:WalkinCustomerInterface['serialNo'],
  totalQuantity:WalkinCustomerInterface['totalQuantity']
}

type vehicleOrderResponse = {
  orders:OrderInterface[],
}

type fetchPickupOrderRersponse = {
  orders:OrderInterface[]
}

type OrderDoneInput = {
  status:string,
  orderId:string
}

type orderVehicle = {
  vehicle:OrderInterface['vehicle']
}

class Customer extends Module{
  private customer:Model<CustomerInterface>
  private order:Model<OrderInterface>
  private complaint:Model<ComplaintInterface>
  private user:Model<UserInterface>
  private walkin:Model<WalkinCustomerInterface>
  private branch:Model<BranchInterface>
  private product:Model<ProductInterface>
  private supplier:Model<SupplierInterface>
  private vehicle:Model<VehicleInterface>
  private cylinder:Model<CylinderInterface>

  constructor(props:CustomerInterfaceProp){
    super()
    this.customer = props.customer
    this.order = props.order
    this.complaint = props.complaint
    this.user = props.user
    this.walkin = props.walkin
    this.branch = props.branch
    this.product = props.product
    this.vehicle = props.vehicle
    this.supplier = props.supplier
    this.cylinder = props.cylinder
  }

  public async createCustomer(data:newCustomerInterface, user:UserInterface):Promise<CustomerInterface|undefined> {
    try {
      const date = new Date()
      date.setDate(date.getDate() + data.cylinderHoldingTime);
      const customer = await this.customer.create({
        ...data,
        cylinderHoldingTime:date.toISOString(),
        branch:user.branch
      });
      await createLog({
        user:user._id,
        activities:{
          title:'Customers',
          //@ts-ignore
          activity:`You added ${customer.name} to the customer list`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(customer as CustomerInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomers(query:QueryInterface, user:UserInterface):Promise<CustomerInterface[]|undefined>{
    try {
      const options = {
        ...query,
        populate:[
          {path:'branch', model:'branches'},
          {path:'products', model:'products'}
        ]
      }
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      let aggregate;
      const aggregate1 = this.customer.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {name:{
                  $regex: search?.toLowerCase() || ''
                }},{customerType:{
                  $regex:search?.toLowerCase() || ''
                }},{nickName:{
                  $regex:search?.toLowerCase() || ''
                }},{contactPerson:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {branch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.customer.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {name:{
                  $regex: search?.toLowerCase() || ''
                }},{customerType:{
                  $regex:search?.toLowerCase() || ''
                }},{nickName:{
                  $regex:search?.toLowerCase() || ''
                }},{contactPerson:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              { branch:ObjectId(user.branch.toString()) }
            ]
          }
        }
      ]);
      if(search?.length && filter?.length) {
        aggregate = aggregate1
      }else {
        aggregate = aggregate2
      }
      //@ts-ignore
      const customers = await this.customer.aggregatePaginate(aggregate, options);
      for(let cust of customers.docs) {
        let branch = await this.branch.findById(cust.branch);
        cust.branch = branch;
        let products = []
        for(let prod of cust.products) {
          let product = await this.product.findById(prod);
          products.push(product)
        }
        cust.products = products
      }
      return Promise.resolve(customers);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchCustomerDetails(id:string):Promise<CustomerInterface|undefined>{
    try {
      const customer = await this.customer.findById(id).populate([
        {path:'branch', model:'branches'},
        {path:'products', model:'products'}
      ]);
      return Promise.resolve(customer as CustomerInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async createOrder(data:CreateOrderInterface, user:UserInterface):Promise<OrderInterface|undefined>{
    try {
      const order = new this.order({...data, branch:user.branch});
      order.tracking.push({
        location:user.role,
        status:'pending'
      });
      let findOrder = await this.order.find({}).sort({initOn:-1}).limit(1);

      let initNum
      if(findOrder[0] == undefined) {
        initNum = 1
      }else {
        initNum = findOrder[0].initOn+1
      }
      let init = "GRN"
      // let str = ""+initNum
      // let pad = "000000"
      // let ans = pad.substring(0, pad.length - str.length) + str;
      const orderNumber = padLeft(initNum, 6, "");
      let grnNo = init+orderNumber;
      order.orderNumber = orderNumber;
      order.initOn = initNum

      await order.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Order',
          //@ts-ignore
          activity:`You created a new order`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(order);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async assignOrderToVehicle(data:OrderAssignVehicle, user:UserInterface):Promise<OrderInterface|undefined>{
    try {
      const order = await this.order.findByIdAndUpdate(data.orderId, {$set:data}, {new:true}).populate({
        path:'vehicle', model:'vehicle',populate:{
          path:'assignedTo', model:'User'
        }
      });
      return Promise.resolve(order as OrderInterface)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchAllCustomers(user:UserInterface):Promise<CustomerInterface[]|undefined>{
    try {
      const customers = await this.customer.find({branch:user.branch});
      return Promise.resolve(customers);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchOrdersAssignedToVehicle(query:QueryInterface,data:orderVehicle):Promise<vehicleOrderResponse|undefined>{
    try {
      const options = {
        ...query,
        populate:[
          {path:'vehicle', model:'vehicle',populate:{
              path:'assignedTo', model:'User'
            }
          },
          {path:'supplier', model:'supplier'},
          {path:'customer', model:'customer'}
        ]
      }
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      let aggregate;
      const aggregate1 = this.order.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {status:{
                  $regex: search?.toLowerCase() || ''
                }},
                {orderNumber:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              { pickupType: filter?.toLowerCase() },
              {vehicle: data.vehicle}
            ]
          }
        }
      ]);
      const aggregate2 = this.order.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {status:{
                  $regex: search?.toLowerCase() || ''
                }},
                {orderNumber:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              { vehicle: data.vehicle }
            ]
          }
        }
      ]);
      if(filter?.length) {
        aggregate = aggregate1
      }else {
        aggregate = aggregate2
      }
      //@ts-ignore
      const orders = await this.order.aggregatePaginate(aggregate,options);
      //Populate the reference fields
      for(let order of orders.docs) {
        let vehicle = await this.vehicle.findById(order.vehicle).populate('assignedTo');
        order.vehicle = vehicle
        let supplier = await this.supplier.findById(order.supplier);
        order.supplier = supplier;
        let customer = await this.customer.findById(order.supplier);
        order.customer = customer;
      }
      return Promise.resolve({
        orders
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomerOrder(query:QueryInterface,customerId:string):Promise<OrderInterface[]|undefined>{
    try {

      let options = {
        ...query,
        populate:[
          {path:'customer', model:'customer'},
          {path:'vehicle', model:'vehicle',populate:{
            path:'assignedTo', model:'User'
          }}
        ]
      }
      //@ts-ignore
      const orders = await this.order.paginate({customer:`${customerId}`}, options);
      return Promise.resolve(orders);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchAllOrders(query:QueryInterface, user:UserInterface):Promise<fetchPickupOrderRersponse|undefined>{
    try {
      let options = {
        ...query,
        populate:[
          {path:'vehicle', model:'vehicle'},
          {path:'supplier', model:'supplier'},
          {path:'customer', model:'customer'},
          {path:'gasType', model:'cylinder'}
        ]
      }
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      let aggregate;
      const aggregate1 = this.order.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {status:{
                  $regex: search?.toLowerCase() || ''
                }},
                {orderNumber:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              { pickupType: filter?.toLowerCase() },
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.order.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {status:{
                  $regex: search?.toLowerCase() || ''
                }},
                {orderNumber:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              { branch: ObjectId(user.branch.toString()) }
            ]
          }
        }
      ]);
      if(filter?.length) {
        aggregate = aggregate1
      }else {
        aggregate = aggregate2
      }
      //@ts-ignore
      const orders = await this.order.aggregatePaginate(aggregate, options);
      //Populate reference fields
        for(let order of orders.docs) {
          let vehicle = await this.vehicle.findById(order.vehicle).populate('assignedTo');
          order.vehicle = vehicle
          let supplier = await this.supplier.findById(order.supplier);
          order.supplier = supplier;
          let customer = await this.customer.findById(order.supplier);
          order.customer = customer;
          let gasType = await this.cylinder.findById(order.gasType);
          order.gasType = gasType;
        }
      return Promise.resolve({
        orders
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async markOrderAsDone(data:OrderDoneInput, user:UserInterface ):Promise<OrderInterface|undefined>{
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
      await createLog({
        user:user._id,
        activities:{
          title:'Order',
          //@ts-ignore
          activity:`You completed this order`,
          time: new Date().toISOString()
        }
      });
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
      const order = await this.order.findById(orderId).populate([
        {path:'customer', model:'customer'},
        {path:'vehicle', model:'vehicle',populate:{
          path:'assignedTo', model:'User'
        }}
      ]);
      return Promise.resolve(order as OrderInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async deletePickupOrder(orderId:string):Promise<any>{
    try {
      const order = await this.order.findById(orderId);
      if(!order) {
        throw new BadInputFormatException('this order may have been deleted');
      }
      await order.remove();
      return Promise.resolve({
        message:'pickup order deleted'
      });
    } catch (e) {

    }
  }

  public async makeComplaint(data:NewComplainInterface, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try {
      // console.log(data);
      const complaint = new this.complaint({
        ...data,
        branch:user.branch
      });
      const hod = await this.user.findOne({branch:user.branch, role:user.role, subrole:'head of department'});
      if(complaint.complaintType == 'cylinder'){
        complaint.initiator = user._id
        complaint.approvalStage = stagesOfApproval.STAGE1
        complaint.approvalStatus = TransferStatus.PENDING
        complaint.status = complaintStatus.PENDING;
        complaint.nextApprovalOfficer = hod?._id
        complaint.approvalOfficers.push({
          name:user.name,
          id:user._id,
          office:user.subrole,
          department:user.role,
          stageOfApproval:stagesOfApproval.STAGE1
        });
        let com = {
          comment:data.comment,
          commentBy:user._id
        }
        //@ts-ignore
        complaint.comments.push(com);
      }

      await complaint.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Complaint',
          //@ts-ignore
          activity:`You created a complaint for a customer`,
          time: new Date().toISOString()
        }
      });
      new Notify().push({
        subject: "Complaint",
        content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
        user: hod
      });
      return Promise.resolve(complaint);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveComplaint(data:ApprovalInput, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try {
      // console.log(data)
      let loginUser = await this.user.findById(user._id).select('+password');
      let matchPWD = await loginUser?.comparePWD(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      const complaint = await this.complaint.findById(data.id).populate([
        {path:'customer', ref:'User'}
      ]);
      if(!complaint){
        throw new BadInputFormatException('complaint not found')
      }
      if(complaint?.complaintType == 'cylinder'){
        if(data.status == ApprovalStatus.REJECTED){
          if(complaint?.approvalStage == stagesOfApproval.STAGE1){
            let AO = complaint.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE1);
            let track = {
              title:"Approval Process",
              stage:stagesOfApproval.STAGE2,
              status:ApprovalStatus.REJECTED,
              dateApproved:new Date().toISOString(),
              approvalOfficer:user._id,
              nextApprovalOfficer:AO[0].id
            }
            let checkOfficer = complaint.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
            if(checkOfficer.length == 0) {
              complaint.approvalOfficers.push({
                name:user.name,
                id:user._id,
                office:user.subrole,
                department:user.role,
                stageOfApproval:stagesOfApproval.STAGE2
              })
            }
            //@ts-ignore
            complaint.tracking.push(track)
            complaint.approvalStage = stagesOfApproval.START
            complaint.nextApprovalOfficer = AO[0].id
            complaint.comments.push({
              comment:data.comment,
              commentBy:user._id
            })
            await complaint.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Complaint',
                //@ts-ignore
                activity:`You Rejected a complaint approval for ${complaint.customer.name}`,
                time: new Date().toISOString()
              }
            });
            let approvalUser = await this.user.findById(AO[0].id);
            new Notify().push({
              subject: "Complaint",
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
              user: approvalUser
            });
            return Promise.resolve(complaint)
          }else if(complaint?.approvalStage == stagesOfApproval.STAGE2) {
            let AO = complaint.approvalOfficers.filter(officer=>officer.stageOfApproval == stagesOfApproval.STAGE2);
            let track = {
              title:"Approval Process",
              stage:stagesOfApproval.STAGE3,
              status:ApprovalStatus.REJECTED,
              dateApproved:new Date().toISOString(),
              approvalOfficer:user._id,
              nextApprovalOfficer:AO[0].id
            }
            let checkOfficer = complaint.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
            if(checkOfficer.length == 0) {
              complaint.approvalOfficers.push({
                name:user.name,
                id:user._id,
                office:user.subrole,
                department:user.role,
                stageOfApproval:stagesOfApproval.STAGE3
              });
            }
            //@ts-ignore
            complaint.tracking.push(track);
            complaint.approvalStage = stagesOfApproval.STAGE1
            complaint.nextApprovalOfficer = AO[0].id
            complaint.comments.push({
              comment:data.comment,
              commentBy:user._id
            })
            await complaint.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Complaint',
                //@ts-ignore
                activity:`You Rejected a complaint approval for ${complaint.customer.name}`,
                time: new Date().toISOString()
              }
            });
            let approvalUser = await this.user.findById(AO[0].id);
            new Notify().push({
              subject: "Complaint",
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
              user: approvalUser
            });
            return Promise.resolve(complaint);
          }
        }else{
          let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
            path:'branch', model:'branches'
          });
          // console.log(hod);
          if(complaint?.approvalStage == stagesOfApproval.START){
            let checkOfficer = complaint.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
            if(checkOfficer.length == 0) {
              complaint.approvalOfficers.push({
                name:user.name,
                id:user._id,
                office:user.subrole,
                department:user.role,
                stageOfApproval:stagesOfApproval.STAGE1
              });
            }
            complaint.approvalStage = stagesOfApproval.STAGE1;
            //@ts-ignore
            complaint.nextApprovalOfficer = hod?._id;
            complaint.comments.push({
              comment:data.comment,
              commentBy:user._id
            })
            await complaint.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Complaint',
                //@ts-ignore
                activity:`You Approved a complaint approval for ${complaint.customer.name}`,
                time: new Date().toISOString()
              }
            });
            new Notify().push({
              subject: "Complaint",
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
              user: hod
            });
            return Promise.resolve(complaint);
          }else if(complaint?.approvalStage == stagesOfApproval.STAGE1){
            // let track = {
            //   title:"Initiate complaint",
            //   stage:stagesOfApproval.STAGE2,
            //   status:ApprovalStatus.APPROVED,
            //   dateApproved:new Date().toISOString(),
            //   approvalOfficer:user._id,
            //   //@ts-ignore
            //   nextApprovalOfficer:hod?.branch.branchAdmin
            // }
            // console.log(track);
            let checkOfficer = complaint.approvalOfficers.filter(officer=>`${officer.id}` == `${user._id}`);
            if(checkOfficer.length == 0){
              complaint.approvalOfficers.push({
                name:user.name,
                id:user._id,
                office:user.subrole,
                department:user.role,
                stageOfApproval:stagesOfApproval.STAGE2
              });
            }
            complaint.approvalStage = stagesOfApproval.STAGE2;
            //@ts-ignore
            complaint.nextApprovalOfficer = hod?.branch.branchAdmin;

            complaint.comments.push({
              comment:data.comment,
              commentBy:user._id
            })
            await complaint.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Complaint',
                //@ts-ignore
                activity:`You Approved a complaint approval for ${complaint.customer.name}`,
                time: new Date().toISOString()
              }
            });
            let approvalUser = await this.user.findById(complaint.nextApprovalOfficer);
            new Notify().push({
              subject: "Complaint",
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
              user: approvalUser
            });
            return Promise.resolve(complaint)
          } else if(complaint?.approvalStage == stagesOfApproval.STAGE2){
            // let track = {
            //   title:"Initiate complaint",
            //   stage:stagesOfApproval.STAGE3,
            //   status:ApprovalStatus.APPROVED,
            //   dateApproved:new Date().toISOString(),
            //   approvalOfficer:user._id,
            //   // nextApprovalOfficer:data.nextApprovalOfficer
            // }
            let checkOfficer = complaint.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
            if(checkOfficer.length == 0){
              complaint.approvalOfficers.push({
                name:user.name,
                id:user._id,
                office:user.subrole,
                department:user.role,
                stageOfApproval:stagesOfApproval.STAGE3
              });
            }
            //@ts-ignore
            // complaint.tracking.push(track)
            complaint.approvalStage = stagesOfApproval.APPROVED;
            complaint.approvalStatus = TransferStatus.COMPLETED
            //@ts-ignore
            // complaint.nextApprovalOfficer = data.nextApprovalOfficer
            complaint.comments.push({
              comment:data.comment,
              commentBy:user._id
            });
            await complaint.save();
            await createLog({
              user:user._id,
              activities:{
                title:'Complaint',
                //@ts-ignore
                activity:`You Approved a complaint approval for ${complaint.customer.name}`,
                time: new Date().toISOString()
              }
            });
            let approvalUser = await this.user.findById(complaint.initiator);
            new Notify().push({
              subject: "Complaint",
              content: `Complaint approval complete. click to view ${env.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
              user: approvalUser
            });
            return Promise.resolve(complaint);
          }
        }

      }
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchUserComplaintApproval(query:QueryInterface, user:UserInterface):Promise<ComplaintInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'branch', model:'branches'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'customer', model:'customer'}
        ]
      }
      let aggregate;
      const aggregate1 = this.complaint.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {customerName:{
                  $regex: search?.toLowerCase() || ''
                }},{issue:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {approvalStatus:TransferStatus.PENDING},
              {nextApprovalOfficer: ObjectId(user._id.toString())},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.complaint.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {title:{
                  $regex: search?.toLowerCase() || ''
                }},{issue:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {approvalStatus:TransferStatus.PENDING},
              {nextApprovalOfficer: ObjectId(user._id.toString())},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      if(search?.length && filter?.length) {
        aggregate = aggregate1
      }else if(search?.length && !filter?.length) {
        aggregate2
      }
      //@ts-ignore
      const complaints = await this.complaint.aggregatePaginate(aggregate,options);
      //populate id reference fields
        for(let comp of complaints.docs) {
          let branch = await this.branch.findById(comp.branch);
          comp.branch = branch
          let initiator = await this.user.findById(comp.initiator);
          comp.initiator = initiator;
          let nextApprovalOfficer = await this.user.findById(comp.nextApprovalOfficer);
          comp.nextApprovalOfficer = nextApprovalOfficer;
          let customer = await this.customer.findById(comp.customer);
          comp.customer = customer;
        }

      // let startStage = complaints.filter(transfer=> {
      //   if(transfer.approvalStage == stagesOfApproval.START) {
      //     for(let tofficer of transfer.approvalOfficers) {
      //       if(`${tofficer.id}` == `${user._id}`){
      //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
      //           return transfer
      //         }
      //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
      //         return transfer
      //       }
      //     }
      //   }
      // });
      // let stage1 = complaints.filter(transfer=>{
      //   if(transfer.approvalStage == stagesOfApproval.STAGE1) {
      //     for(let tofficer of transfer.approvalOfficers) {
      //       if(`${tofficer.id}` == `${user._id}`){
      //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
      //           return transfer
      //         }
      //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
      //         return transfer
      //       }
      //     }
      //   }
      // });
      // let stage2 = complaints.filter(transfer=>{
      //   if(transfer.approvalStage == stagesOfApproval.STAGE2) {
      //     for(let tofficer of transfer.approvalOfficers) {
      //       if(`${tofficer.id}` == `${user._id}`){
      //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
      //           return transfer
      //         }
      //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
      //         return transfer
      //       }
      //     }
      //   }
      // });
      // let pendingApprovals;
      // if(user.subrole == 'superadmin'){
      //   pendingApprovals = stage2;
      // }else if(user.subrole == 'head of department'){
      //   pendingApprovals = stage1
      // }else {
      //   pendingApprovals = startStage;
      // }
      return Promise.resolve(complaints)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchComplaints(query:QueryInterface, customerId:string):Promise<ComplaintInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'branch', model:'branches'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'customer', model:'customer'}
        ]
      }
      let aggregate;
      const aggregate1 = this.complaint.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {title:{
                  $regex: search?.toLowerCase() || ''
                }},
                {issue:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {approvalStatus: filter?.toLowerCase()},
              {customer: ObjectId(customerId)}
            ]
          }
        }
      ]);
      const aggregate2 = this.complaint.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {title:{
                  $regex: search?.toLowerCase() || ''
                }},
                {issue:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {customer: ObjectId(customerId)}
            ]
          }
        }
      ]);
      if(search?.length && filter?.length) {
        aggregate = aggregate1
      }else if(search?.length && !filter?.length) {
        aggregate2
      }
      //@ts-ignore
      const complains = await this.complaint.aggregatePaginate(aggregate, options);
      //populate id reference fields
      for(let comp of complains.docs) {
        let branch = await this.branch.findById(comp.branch);
        comp.branch = branch
        let initiator = await this.user.findById(comp.initiator);
        comp.initiator = initiator;
        let nextApprovalOfficer = await this.user.findById(comp.nextApprovalOfficer);
        comp.nextApprovalOfficer = nextApprovalOfficer;
        let customer = await this.customer.findById(comp.customer);
        comp.customer = customer;
      }
      return Promise.resolve(complains);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchApprovedComplaints(query:QueryInterface, user:UserInterface):Promise<ComplaintInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'branch', model:'branches'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'customer', model:'customer'}
        ]
      }
      let aggregate;
      const aggregate1 = this.complaint.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {title:{
                  $regex: search?.toLowerCase() || ''
                }},
                {issue:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {approvalStatus: filter?.toLowerCase()},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.complaint.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {title:{
                  $regex: search?.toLowerCase() || ''
                }},
                {issue:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      if(search?.length && filter?.length) {
        aggregate = aggregate1
      }else if(search?.length && !filter?.length) {
        aggregate2
      }
      //@ts-ignore
      const complaints = await this.complaint.aggregatePaginate(aggregate, options);
      //populate id reference fields
      for(let comp of complaints.docs) {
        let branch = await this.branch.findById(comp.branch);
        comp.branch = branch
        let initiator = await this.user.findById(comp.initiator);
        comp.initiator = initiator;
        let nextApprovalOfficer = await this.user.findById(comp.nextApprovalOfficer);
        comp.nextApprovalOfficer = nextApprovalOfficer;
        let customer = await this.customer.findById(comp.customer);
        comp.customer = customer;
      }

      return Promise.resolve(complaints);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async complaintsDetails(complaintId:string):Promise<ComplaintInterface|undefined>{
    try {
      const complaint = await this.complaint.findById(complaintId).populate([
          {path:'customer', model:'customer'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'branch', model:'branches'}
      ]);
      return Promise.resolve(complaint as ComplaintInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async resolveComplaint(complaintId:string, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try{
      const complaint = await this.complaint.findById(complaintId).populate([
        {path:'customer', model:'User'}
      ]);
      if(!complaint) {
        throw new BadInputFormatException('complaint not found');
      }
      complaint.status = complaintStatus.RESOLVED;
      await complaint.save()
      await createLog({
        user:user._id,
        activities:{
          title:'Complaint',
          //@ts-ignore
          activity:`You resolved a complaint for ${complaint.customer.name}`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(complaint);
    }catch(e){
      this.handleException(e);
    }
  }

  public async registerWalkinCustomers(data:newWalkinCustomer, user:UserInterface):Promise<WalkinCustomerInterface|undefined>{
    try{
      const customer = new this.walkin({...data, branch:user.branch});
      const findCustomers = await this.walkin.find().sort({serialNo:-1}).limit(1);
      // let docs = findCustomers.map(doc=>doc.serialNo);
      // let maxNumber = Math.max(...docs);
      // let sn = maxNumber + 1
      // customer.serialNo = sn | 1;
      if(findCustomers[0]) {
        customer.serialNo = findCustomers[0].serialNo+1
      }else {
        customer.serialNo = 1
      }
      let init = "ECR"
      let num =  padLeft(customer.serialNo, 6, "");
      //@ts-ignore
      customer.ecrNo = init+num;
      let icnInit = "ICN"
      // let icn = await generateToken(6);
      //@ts-ignore
      customer.icnNo = icnInit+num;
      customer.security = user._id;

      await customer.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Walk in customer',
          //@ts-ignore
          activity:`You registered ${customer.name} as a walk in customer`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(customer);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchWalkinCustomers(query:QueryInterface, user:UserInterface):Promise<WalkinCustomerInterface[]|undefined>{
    try{
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'branch', model:'branches'}
        ]
      }
      let aggregate;
      const aggregate1 = this.walkin.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {customerName:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {status: filter?.toLowerCase()},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.walkin.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {customerName:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      if(search?.length && filter?.length) {
        aggregate = aggregate1
      }else if(search?.length && !filter?.length) {
        aggregate2
      }
      //@ts-ignore
      const customers = await this.walkin.aggregatePaginate(aggregate, options);
      //populate id reference fields
      for(let cust of customers.docs) {
        let branch = await this.branch.findById(cust.branch);
        cust.branch = branch;
        let security = await this.user.findById(cust.security);
        cust.security = security;
        let recievedBy = await this.user.findById(cust.recievedBy);
        cust.recievedBy = recievedBy;
      }
      return Promise.resolve(customers);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchWalkinCustomer(icnNo:string):Promise<WalkinCustomerInterface|undefined>{
    try {
      const customer = await this.walkin.findOne({icnNo}).populate([
        {path:'branch', model:'branches'},
        {path:'recievedBy', model:'User'},
        {path:'security', model:'User'}
      ]);
      return Promise.resolve(customer as WalkinCustomerInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async updateWalkinCustomer(customerId:string, data:newWalkinCustomer, user:UserInterface):Promise<WalkinCustomerInterface|undefined>{
    try {
      const customer = await this.walkin.findById(customerId).populate([
        {path:'branch', model:'branches'},
        {path:'recievedBy', model:'User'},
        {path:'security', model:'User'}
      ]);
      if(!customer) {
        throw new BadInputFormatException('this customer was not registered.. contact security!!!');
      }
      let updatedCustomer = await this.walkin.findByIdAndUpdate(customer._id, {...data, recievedBy:user._id}, {new:true});
      return Promise.resolve(updatedCustomer as WalkinCustomerInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async deleteWalkinCustomer(customerId:string, user:UserInterface):Promise<any>{
    try {
      const customer = await this.walkin.findById(customerId);
      if(!customer) {
        throw new BadInputFormatException('customer not found');
      }
      await createLog({
        user:user._id,
        activities:{
          title:'Walk in customer',
          //@ts-ignore
          activity:`You Removed ${customer.name}`,
          time: new Date().toISOString()
        }
      });
      await customer.remove();
      return Promise.resolve({
        message:'Done'
      })
    } catch (e) {
      this.handleException(e);
    }
  }

  public async markFilledCustomer(cylinderId:string):Promise<WalkinCustomerInterface|undefined>{
    try {
      const customer = await this.walkin.findById(cylinderId);
      if(!customer) {
        throw new BadInputFormatException('customer not found');
      }
      customer.status = WalkinCustomerStatus.FILLED
      await customer.save();
      return Promise.resolve(customer);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchFilledCustomerCylinders(query:QueryInterface, user:UserInterface):Promise<WalkinCustomerInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'branch', model:'branches'}
        ]
      }
      let aggregate;
      const aggregate1 = this.walkin.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {customerName:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {status: filter?.toLowerCase()},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.walkin.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {customerName:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {branch: ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      if(search?.length && filter?.length) {
        aggregate = aggregate1
      }else if(search?.length && !filter?.length) {
        aggregate2
      }
      //@ts-ignore
      const cylinders = await this.walkin.aggregatePaginate(aggregate,options);
      for(let cyl of cylinders.docs) {
        let branch = await this.cylinder.findById(cyl.branch);
        cyl.branch = branch;
      }
      return cylinders;
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Customer;
