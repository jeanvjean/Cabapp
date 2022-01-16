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
import { generateToken, padLeft, passWdCheck } from "../../util/token";
import { BranchInterface } from "../../models/branch";
import { ProductInterface } from "../../models/inventory";
import { VehicleInterface } from "../../models/vehicle";
import { SupplierInterface } from "../../models/supplier";
import { CylinderInterface } from "../../models/cylinder";
import { DeletedCustomer } from "../../models/deletedCustomers";
import { PickupInterface } from "../../models/driverPickup";



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
  deleteCustomer:Model<DeletedCustomer>
  pickup:Model<PickupInterface>
}

interface newCustomerInterface {
  name:CustomerInterface['name']
  customerType:CustomerInterface['customerType']
  customerSubType?:CustomerInterface['customerSubType']
  modeOfService?:CustomerInterface['modeOfService']
  nickName:CustomerInterface['nickName']
  address:CustomerInterface['address']
  contactPerson:CustomerInterface['contactPerson']
  email?:CustomerInterface['email']
  TIN:CustomerInterface['TIN']
  phoneNumber:CustomerInterface['phoneNumber']
  rcNumber:CustomerInterface['rcNumber']
  cylinderHoldingTime?:number
  territory:CustomerInterface['territory']
  products:string
  CAC:CustomerInterface['CAC']
  validID:CustomerInterface['validID']
  vat:CustomerInterface['vat']
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
  complaint?:ComplaintInterface['complaint']
  cylinders?:ComplaintInterface['cylinders'],
  replaceCylinder?:ComplaintInterface['replaceCylinder']
  aprovalOfficers?:ComplaintInterface['nextApprovalOfficer']
  nextApprovalOfficer?:ComplaintInterface['nextApprovalOfficer']
  additionalAction?:ComplaintInterface['additionalAction']
  icnNo?:ComplaintInterface['icnNo']
  ecrNo?:ComplaintInterface['ecrNo']
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
  private deleteCustomer:Model<DeletedCustomer>
  private pickup:Model<PickupInterface>

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
    this.deleteCustomer = props.deleteCustomer
    this.pickup = props.pickup
  }

  public async createCustomer(data:newCustomerInterface, user:UserInterface):Promise<CustomerInterface|undefined> {
    try {
      if(data.cylinderHoldingTime) {
        const date = new Date()
        date.setDate(date.getDate() + data.cylinderHoldingTime);
        //@ts-ignore
        data.cylinderHoldingTime = date.toISOString()
      }
      // let exist = await this.customer.findOne({email:data.email, branch:user.branch});
      // // console.log(exist)
      // if(exist) {
      //   throw new BadInputFormatException('a customer with this email exists');
      // }

      let cid;
      let customers = await this.customer.find({}).sort({gen_id_no: -1}).limit(1);
      if(!customers[0]) {
        cid = 1
      }else {
        cid = customers[0].gen_id_no + 1
      }

      let gen_id = padLeft(cid, 6, '');
      let ucid = 'CUS/'+ gen_id;

      let products = JSON.parse(data.products)
      const customer = await this.customer.create({
        ...data,
        products,
        branch:user.branch,
        unique_id: ucid
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
        ],
        sort:{createdAt: -1}
      }
      let q = {
        branch:user.branch
      }
      let or = []
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter,name, email, phone } = query;
     if(name) {
       //@ts-ignore
       or.push({name:new RegExp(name, 'gi')})
     }
     if(email) {
       //@ts-ignore
       or.push({email:new RegExp(email, 'gi')})
     }
     if(phone) {
      //@ts-ignore
      or.push({phoneNumber:new RegExp(phone, 'gi')})
    }

    if(search) {
      or.push({nickName:new RegExp(search, 'gi')})
      or.push({customerType:new RegExp(search, 'gi')})
      or.push({address:new RegExp(search, 'gi')})
      or.push({TIN:new RegExp(search, 'gi')})
      or.push({rcNumber:new RegExp(search, 'gi')})
    }

    if(or.length > 0) {
      //@ts-ignore
      q = {...q, $or:or}
    }
      //@ts-ignore
      const customers = await this.customer.paginate(q, options);
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

  public async deleteACustomer(customerId:string, user:UserInterface, reason:string):Promise<any>{
    try {
      let customer = await this.customer.findById(customerId)
      if(!customer) {
        throw new BadInputFormatException('not found');
      }
      await this.deleteCustomer.create({
        name:customer.name,
        email:customer.email,
        branch:user.branch,
        reason,
        type:customer.customerType
      });
      await customer.remove();
      return Promise.resolve({
        message:'customer deleted'
      });
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchDeletedCustomers(query:QueryInterface, user:UserInterface):Promise<DeletedCustomer[]|undefined>{
    try {
      const { search, name, email } = query;
      let options = {
        page:query.page || 1,
        limit:query.limit ||10,
        sort:{createdAt: -1}
      }
      let q={
        branch:user.branch
      }
      let or = [];
      if(name) {
        //@ts-ignore
        q = {...q, name:name}
      }
      if(email) {
        //@ts-ignore
        q = {...q, email:email}
      }
      if(search) {
        or.push({reason: new RegExp(search, 'gi')});
      }
      const ObjectId = mongoose.Types.ObjectId
      
      //@ts-ignore
      const customers = await this.deleteCustomer.paginate(q, options);
      return Promise.resolve(customers)
    } catch (e) {
      this.handleException(e);
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
      let ecr = "ECR";
      let icn = "ICN";
      // let str = ""+initNum
      // let pad = "000000"
      // let ans = pad.substring(0, pad.length - str.length) + str;
      const orderNumber = padLeft(initNum, 6, "");
      order.ecrNo = ecr+orderNumber;
      order.icnNo = icn+orderNumber;
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
        page:query.page,
        limit:query.limit,
        populate:[
          {path:'vehicle', model:'vehicle',populate:{
              path:'assignedTo', model:'User'
            }
          },
          {path:'supplier', model:'supplier'},
          {path:'customer', model:'customer'}
        ],
        sort:{createdAt: -1}
      }
      const { search, filter } = query;
      let or = [];
      let q = {
          vehicle: data.vehicle
      }

      if(filter) {
        //@ts-ignore
          q = {...q, pickupType: filter}
      }
      if(search) {
        or.push({status: new RegExp(search, 'gi')})
        or.push({orderNumber: new RegExp(search, 'gi')}),
        or.push({ecrNo: new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      //@ts-ignore
      const orders = await this.order.paginate(q,options);
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
        ],
        sort:{createdAt: -1}
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
        
        page:query.page,
        limit:query.limit,
        populate:[
          {path:'vehicle', model:'vehicle',populate:{
            path:'assignedTo', model:'User'
          }},
          {path:'supplier', model:'supplier'},
          {path:'customer', model:'customer'},
          {path:'gasType', model:'cylinder'}
        ],
        sort:{createdAt: -1}
      }
      const { search, filter, type } = query;
      let or = [];
      let q = {
          branch: user.branch
      }

      if(filter) {
        //@ts-ignore
          q = {...q, pickupType: filter}
      }
      if(type) {
        //@ts-ignore
          q = {...q, orderType: type}
      }
      if(search) {
        or.push({status: new RegExp(search, 'gi')})
        or.push({orderNumber: new RegExp(search, 'gi')}),
        or.push({ecrNo: new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = {...q, $or:or}
      }
      //@ts-ignore
      const orders = await this.order.paginate(q, options);
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
        content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
        user: hod
      });
      return Promise.resolve(complaint);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveComplaint(data:ApprovalInput, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try {
      await passWdCheck(user, data.password);
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
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
              user: hod
            });
            return Promise.resolve(complaint);
          }else if(complaint?.approvalStage == stagesOfApproval.STAGE1){
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
            let branchAdmin = await this.user.findOne({branch:hod?.branch, subrole:"superadmin"});
            // console.log(branchAdmin)
            
            complaint.nextApprovalOfficer = branchAdmin?._id;

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
              content: `A complaint requires your attention click to view ${env.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
              user: approvalUser
            });
            return Promise.resolve(complaint)
          } else if(complaint?.approvalStage == stagesOfApproval.STAGE2){
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
              content: `Complaint approval complete. click to view ${env.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
        page:query.page || 1,
        limit:query.limit || 10,
        populate:[
          {path:'branch', model:'branches'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'customer', model:'customer'},
          {path:"icn", model:"out-going-cylinders"},
          {path:"ecr", model:"empty-cylinders"}
        ],
        sort:{createdAt: -1}
      }
      // console.log(user);
      let q = {
        branch: user.branch,
        approvalStatus:TransferStatus.PENDING,
        nextApprovalOfficer: user._id
      }
      let or = [];
      if(search) {
        or.push({customerName: new RegExp(search, 'gi')})
        or.push({issue: new RegExp(search, 'gi')})
        or.push({deliveryNo:new RegExp(search, 'gi')})
        or.push({ecrNo:new RegExp(search, 'gi')})
        or.push({icnNo:new RegExp(search, 'gi')})
      }
      if(or.length > 0) {
        //@ts-ignore
        q = { ...q, $or:or }
      }
      //@ts-ignore
      const complaints = await this.complaint.paginate(q,options);
      return Promise.resolve(complaints);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchComplaints(query:QueryInterface, user:UserInterface):Promise<ComplaintInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter, customer, complaintStatus, fromDate, toDate, supplyDate } = query;
      // console.log(customerId);
      const options = {
        page:query.page || 1,
        limit:query.limit || 10,
        populate:[
          {path:'branch', model:'branches'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'customer', model:'customer'},
          {path:"icn", model:"out-going-cylinders"},
          {path:"ecr", model:"empty-cylinders"}
        ],
        sort:{createdAt: -1}
      }
      let q = {
        branch: user.branch
      }

      let or = [];
      if(search) {
        or.push({title: new RegExp(search, 'gi')})
        or.push({issue: new RegExp(search, 'gi')})
        or.push({deliveryNo:new RegExp(search, 'gi')})
        or.push({ecrNo:new RegExp(search, 'gi')})
        or.push({icnNo:new RegExp(search, 'gi')})
      }
      if(filter) {
        //@ts-ignore
        q = {...q, approvalStatus:filter}
      }
      if(complaintStatus) {
        //@ts-ignore
        q = {...q,status: complaintStatus }
      }
      if(customer) {
        //@ts-ignore
        q = {...q,customer: customer }
      }

      if(fromDate) {
        //@ts-ignore
        q = {...q,createdAt:{$gte: new Date(fromDate)} }
      }
      if(toDate) {
        //@ts-ignore
        q = {...q,createdAt:{$lte: new Date(toDate)} }
      }
      if(supplyDate) {
        //@ts-ignore
        q = {...q,supplyDate:{$eq: new Date(supplyDate)} }
      }
      if(or.length > 0) {
        //@ts-ignore
        q = { ...q, $or:or }
      }
      //@ts-ignore
      const complains = await this.complaint.paginate(q, options);
      return Promise.resolve(complains);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchApprovedComplaints(query:QueryInterface, user:UserInterface):Promise<ComplaintInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId;
      const { search, filter, supplyDate } = query;
      const options = {
        page:query.page || 1,
        limit:query.limit || 10,
        populate:[
          {path:'branch', model:'branches'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'customer', model:'customer'},
          {path:"icn", model:"out-going-cylinders"},
          {path:"ecr", model:"empty-cylinders"}
        ],
        sort:{createdAt: -1}
      }
      let q = {
        branch: user._id
      }

      let or = [];
      if(search) {
        or.push({title: new RegExp(search, 'gi')})
        or.push({issue: new RegExp(search, 'gi')})
        or.push({deliveryNo:new RegExp(search, 'gi')})
        or.push({ecrNo:new RegExp(search, 'gi')})
        or.push({icnNo:new RegExp(search, 'gi')})
      }
      if(filter?.length) {
        //@ts-ignore
        q = {...q, approvalStatus:filter}
      }
      if(or.length > 0) {
        //@ts-ignore
        q = { ...q, $or:or }
      }
      if(supplyDate) {
        //@ts-ignore
        q = {...q,supplyDate:{$eq: new Date(supplyDate)} }
      }
      //@ts-ignore
      const complaints = await this.complaint.paginate(q, options);
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
          {path:'branch', model:'branches'},
          {path:"icn", model:"out-going-cylinders"},
          {path:"ecr", model:"empty-cylinders"}
      ]);
      return Promise.resolve(complaint as ComplaintInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async resolveComplaint(complaintId:string, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try{
      const complaint = await this.complaint.findById(complaintId).populate([
          {path:'customer', model:'customer'},
          {path:'initiator', model:'User'},
          {path:'nextApprovalOfficer', model:'User'},
          {path:'branch', model:'branches'},
          {path:"icn", model:"out-going-cylinders"},
          {path:"ecr", model:"empty-cylinders"}
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
        ],
        sort:{createdAt: -1}
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

  public async customerOrderHistory(query:QueryInterface, user:UserInterface):Promise<any>{
    try {
      let { search, customer_unique_id, activity } = query;
      let q = {
        branch:user.branch
      }
      let or = []
      if(search) {
        or.push({tecrNo:new RegExp(search, 'gi')})
      }
      if(customer_unique_id) {
        //@ts-ignore
        q ={...q, "customers.unique_id": customer_unique_id}
      }
      if(activity) {
        //@ts-ignore
        q = {...q, activity:activity}
      }
      let orders = await this.pickup.find(q);
      if(orders.length <= 0) {
        throw new BadInputFormatException('no order matches the parameters');
      }
      //@ts-ignore
     let mappedCustomer = orders.map(doc=>{
        return doc.customers
      });
      //@ts-ignore
      let customerOrder=[]
      for(let ar of mappedCustomer) {
        for(let a of ar) {
          if(a.unique_id == customer_unique_id) {
            customerOrder.push(a)
          }
        }
      }
      return Promise.resolve(customerOrder);
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Customer;
