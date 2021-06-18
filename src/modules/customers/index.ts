import { Model, Schema } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ComplaintInterface, complaintStatus } from "../../models/complaint";
import { CustomerInterface } from "../../models/customer";
import { CylinderInterface } from "../../models/cylinder";
import { OrderInterface, PickupStatus, pickupType, trackingOrder } from "../../models/order";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { WalkinCustomerInterface, WalkinCustomerStatus } from "../../models/walk-in-customers";
import { ApprovalInput } from "../cylinder";
import Module, { QueryInterface } from "../module";
import { compareSync } from "bcryptjs";
import Notify from '../../util/mail';
import env from '../../configs/static';
import { createLog } from "../../util/logs";



export interface CustomerInterfaceProp{
  customer:Model<CustomerInterface>
  order:Model<OrderInterface>
  complaint:Model<ComplaintInterface>
  user:Model<UserInterface>
  walkin:Model<WalkinCustomerInterface>
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
  orderType:WalkinCustomerInterface['orderType']
  date:WalkinCustomerInterface['date']
  icnNo:WalkinCustomerInterface['icnNo']
  modeOfService:WalkinCustomerInterface['modeOfService']
  serialNo?:WalkinCustomerInterface['serialNo']
  cylinderNo:WalkinCustomerInterface['cylinderNo']
  cylinderSize:WalkinCustomerInterface['cylinderSize']
  totalVolume:WalkinCustomerInterface['totalVolume']
  totalQuantity:WalkinCustomerInterface['totalQuantity']
}

type vehicleOrderResponse = {
  supplier:OrderInterface[],
  customer:OrderInterface[],
  completed:{
    customers:OrderInterface[],
    suppliers:OrderInterface[],
  }
}

type fetchPickupOrderRersponse = {
  supplierOrders?:OrderInterface[],
  customerOrders?:OrderInterface[],
  completedOrders?:{
    customers:OrderInterface[],
    suppliers:OrderInterface[],
  }
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

  constructor(props:CustomerInterfaceProp){
    super()
    this.customer = props.customer
    this.order = props.order
    this.complaint = props.complaint
    this.user = props.user
    this.walkin = props.walkin
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
      //@ts-ignore
      const customers = await this.customer.paginate({branch:user.branch}, {...query});
      return Promise.resolve(customers);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchCustomerDetails(id:string):Promise<CustomerInterface|undefined>{
    try {
      const customer = await this.customer.findById(id).populate({
        path:'vehicle', model:'vehicle',populate:{
          path:'assignedTo', model:'User'
        }
      });
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
      //@ts-ignore
      const orders = await this.order.paginate({vehicle:data.vehicle},options);
      //@ts-ignore
      let customerOrder = await this.order.paginate({vehicle:data.vehicle, status:PickupStatus.PENDING,pickupType:pickupType.CUSTOMER},options);
      //@ts-ignore
      let supplierOrder = await this.order.paginate({vehicle:data.vehicle, status:PickupStatus.PENDING,pickupType:pickupType.SUPPLIER},options);
      //@ts-ignore
      let completed = await this.order.paginate({vehicle:data.vehicle, status:PickupStatus.DONE},options);
      //@ts-ignore
      let completedCustomerOrders = await this.order.paginate({vehicle:data.vehicle, status:PickupStatus.DONE,pickupType:pickupType.CUSTOMER},options);
      //@ts-ignore
      let completedSupplierOrders = await this.order.paginate({vehicle:data.vehicle, status:PickupStatus.DONE,pickupType:pickupType.SUPPLIER},options);
      return Promise.resolve({
        supplier:supplierOrder,
        customer:customerOrder,
        completed:{
          customers:completedCustomerOrders,
          suppliers:completedSupplierOrders
        }
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
          {path:'vehicle', model:'vehicle'}
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
      console.log(options);
      //@ts-ignore
      const orders = await this.order.paginate({branch:user.branch}, options);
      //@ts-ignore
      let customerOrders = await this.order.paginate({branch:user.branch, pickupType:pickupType.CUSTOMER}, options);
      console.log(customerOrders)
      //@ts-ignore
      let supplierOrders = await this.order.paginate({branch:user.branch, pickupType:pickupType.SUPPLIER}, options);
      //@ts-ignore
      let completedOrders = await this.order.paginate({branch:user.branch, status:PickupStatus.DONE}, options);
      //@ts-ignore
      let completedCustomerOrders = await this.order.paginate({
        branch:user.branch,
        pickupType:pickupType.CUSTOMER,
        status:PickupStatus.DONE
      }, options)
      //@ts-ignore
      let completedSupplierOrders = await this.order.paginate({
        branch:user.branch,
        pickupType:pickupType.SUPPLIER,
        status:PickupStatus.DONE
      }, options)

      return Promise.resolve({
        customerOrders,
        supplierOrders,
        completedOrders:{
          customers:completedCustomerOrders,
          suppliers:completedSupplierOrders
        }
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
      const order = await this.order.findById(orderId);
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
      //@ts-ignore
      const complaints = await this.complaint.paginate({
        branch:user.branch,
        approvalStatus:TransferStatus.PENDING,
        nextApprovalOfficer:user._id
      },{...query});

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
      //@ts-ignore
      const complains = await this.complaint.paginate({customer:customerId}, {...query});
      return Promise.resolve(complains);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchApprovedComplaints(query:QueryInterface, user:UserInterface):Promise<ComplaintInterface[]|undefined>{
    try {
      //@ts-ignore
      const complaints = await this.complaint.paginate({ branch:user.branch, ApprovalStatus:TransferStatus.COMPLETED }, {...query});

      return Promise.resolve(complaints);
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
      const findCustomers = await this.walkin.find();
      let docs = findCustomers.map(doc=>doc.serialNo);
      let maxNumber = Math.max(...docs);
      let sn = maxNumber + 1
      customer.serialNo = sn | 1;
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
      //@ts-ignore
      const customers = await this.walkin.paginate({ branch:user.branch }, {...query });
      return Promise.resolve(customers);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchWalkinCustomer(customerId:string):Promise<WalkinCustomerInterface|undefined>{
    try {
      const customer = await this.walkin.findById(customerId);
      return Promise.resolve(customer as WalkinCustomerInterface);
    } catch (e) {
      this.handleException(e);
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
      //@ts-ignore
      const cylinders = await this.walkin.paginate({status:WalkinCustomerStatus.FILLED, branch:user.branch},{...query });
      return cylinders;
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Customer;
