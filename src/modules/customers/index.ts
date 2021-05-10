import { Model } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { ComplaintInterface, complaintStatus } from "../../models/complaint";
import { CustomerInterface } from "../../models/customer";
import { CylinderInterface } from "../../models/cylinder";
import { OrderInterface, PickupStatus, trackingOrder } from "../../models/order";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { WalkinCustomerInterface, WalkinCustomerStatus } from "../../models/walk-in-customers";
import { ApprovalInput } from "../cylinder";
import Module, { QueryInterface } from "../module";



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

type OrderDoneInput = {
  status:string,
  orderId:string
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

  public async createCustomer(data:newCustomerInterface):Promise<CustomerInterface|undefined> {
    try {
      const date = new Date()
      date.setDate(date.getDate() + data.cylinderHoldingTime);
      const customer = await this.customer.create({...data, cylinderHoldingTime:date.toISOString()});
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

  public async makeComplaint(data:NewComplainInterface, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try {
      const complaint = new this.complaint(data);
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
        complaint.save()
      }
      await complaint.save();
      return Promise.resolve(complaint);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveComplaint(data:ApprovalInput, user:UserInterface):Promise<ComplaintInterface|undefined>{
    try {
      const complaint = await this.complaint.findById(data.id);
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
            return Promise.resolve(complaint);
          }else if(complaint?.approvalStage == stagesOfApproval.STAGE1){
            let track = {
              title:"Initiate complaint",
              stage:stagesOfApproval.STAGE2,
              status:ApprovalStatus.APPROVED,
              dateApproved:new Date().toISOString(),
              approvalOfficer:user._id,
              //@ts-ignore
              nextApprovalOfficer:hod?.branch.branchAdmin
            }
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
      const complaints = await this.complaint.find(query);
      let pendingComplaints = complaints.filter(complaint=>complaint.approvalStatus == TransferStatus.PENDING);

      let startStage = pendingComplaints.filter(transfer=> {
        if(transfer.approvalStage == stagesOfApproval.START) {
          for(let tofficer of transfer.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                return transfer
              }
            }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
              return transfer
            }
          }
        }
      });
      let stage1 = pendingComplaints.filter(transfer=>{
        if(transfer.approvalStage == stagesOfApproval.STAGE1) {
          for(let tofficer of transfer.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                return transfer
              }
            }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
              return transfer
            }
          }
        }
      });
      let stage2 = pendingComplaints.filter(transfer=>{
        if(transfer.approvalStage == stagesOfApproval.STAGE2) {
          for(let tofficer of transfer.approvalOfficers) {
            if(`${tofficer.id}` == `${user._id}`){
              if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                return transfer
              }
            }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
              return transfer
            }
          }
        }
      });
      let pendingApprovals;
      if(user.subrole == 'superadmin'){
        pendingApprovals = stage2;
      }else if(user.subrole == 'head of department'){
        pendingApprovals = stage1
      }else {
        pendingApprovals = startStage;
      }
      return Promise.resolve(pendingApprovals)
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

  public async fetchApprovedCOmplaints(query:QueryInterface):Promise<ComplaintInterface[]|undefined>{
    try {
      const complaints = await this.complaint.find(query);
      let approved = complaints.filter(complaint=> complaint.approvalStatus == TransferStatus.COMPLETED);
      return Promise.resolve(approved);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async resolveComplaint(complaintId:string):Promise<ComplaintInterface|undefined>{
    try{
      const complaint = await this.complaint.findById(complaintId);
      if(!complaint) {
        throw new BadInputFormatException('complaint not found');
      }
      complaint.status = complaintStatus.RESOLVED;
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
      return Promise.resolve(customer);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchWalkinCustomers(query:QueryInterface, user:UserInterface):Promise<WalkinCustomerInterface[]|undefined>{
    try{
      const customers = await this.walkin.find({...query, branch:user.branch});
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

  public async deleteWalkinCustomer(customerId:string):Promise<any>{
    try {
      const customer = await this.walkin.findById(customerId);
      if(!customer) {
        throw new BadInputFormatException('customer not found');
      }
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
}

export default Customer;
