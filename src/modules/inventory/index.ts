import { Model, Schema } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { BranchInterface } from "../../models/branch";
import { DisburseProduct, DisburseProductInterface } from "../../models/disburseStock";
import { ProductInterface } from "../../models/inventory";
import { InventoryInterface, ReceivedProduct } from "../../models/receivedProduct";
import { SupplierInterface } from "../../models/supplier";
import { ApprovalStatus, stagesOfApproval, TransferStatus } from "../../models/transferCylinder";
import { UserInterface } from "../../models/user";
import { getTemplate } from "../../util/resolve-template";
import { generateToken } from "../../util/token";
import { ApprovalInput } from "../cylinder";
import Module, { QueryInterface } from "../module";
import Environment from '../../configs/static';
import Notify from '../../util/mail'
import { DeleteResponse } from "../vehicle";

interface ProductProp {
  product:Model<ProductInterface>
  supplier:Model<SupplierInterface>
  inventory:Model<InventoryInterface>
  disburse:Model<DisburseProductInterface>
  branch:Model<BranchInterface>
  user:Model<UserInterface>
}

interface NewProductInterface{
  itemDescription:string
  equipmentModel:string
  equipmentType:string
  areaOfSpecialization:string
  asnlNumber:string
  partNumber:string
  quantity:number
  unitCost:number
  totalCost:number
  reorderLevel:number
  location?:string
  referer?:string
  productName?:string
}

type NewSupplierInterface = {
  productType:SupplierInterface['productType']
  name:SupplierInterface['name']
  location:SupplierInterface['location']
  contactPerson:SupplierInterface['contactPerson']
  emailAddress:SupplierInterface['emailAddress']
  phoneNumber:SupplierInterface['phoneNumber']
  supplierType:SupplierInterface['supplierType']
}

type NewInventory={
  supplier:string,
  LPOnumber:string,
  wayBillNumber:string,
  invoiceNumber:string,
  dateReceived:string,
  products:ReceivedProduct[],
  inspectingOfficer:string,
  grnDocument:string
}

interface NewDisburseInterface{
  products:DisburseProduct[]
  releasedBy:DisburseProductInterface['releasedBy']
  releasedTo:DisburseProductInterface['releasedTo']
  comment:string
  nextApprovalOfficer:string
}

type ApprovalResponseType = {
  message:string,
  disbursement:DisburseProductInterface
}

interface disburseStats {
    totalApproved:number
    totalPending:number
    totalDisbursements:number
}

type DisbursePoolResponse = {
  disburse:DisburseProductInterface[],
  count:disburseStats,
  message?:string
}

interface NewBranchInterface{
  name:BranchInterface['name'],
  location:BranchInterface['location']
  branchAdmin:BranchInterface['branchAdmin']
}


class Product extends Module{
  private product:Model<ProductInterface>
  private supplier:Model<SupplierInterface>
  private inventory:Model<InventoryInterface>
  private disburse:Model<DisburseProductInterface>
  private branch:Model<BranchInterface>
  private user:Model<UserInterface>

  constructor(props:ProductProp) {
    super()
    this.product = props.product
    this.supplier = props.supplier
    this.inventory = props.inventory
    this.disburse = props.disburse
    this.branch = props.branch
    this.user = props.user
  }

  public async createBranch(data:NewBranchInterface):Promise<BranchInterface|undefined>{
    try{
      //@ts-ignore
      let checkEmail = await this.user.findOne({email:data.branchAdmin});
      if(checkEmail) {
        throw new BadInputFormatException('this email already exists on the platform!! please check the email and try again');
      }
      const newUser = new this.user({email:data.branchAdmin, role:'admin', subrole:'superadmin'});
      const branch = new this.branch({...data, branchAdmin:newUser._id});
      newUser.branch = branch._id;
      branch?.officers.push(newUser._id);
      let password = await generateToken(4);
      //@ts-ignore
        newUser.password = password;

        await newUser.save();
        await branch.save();

        const html = await getTemplate('invite', {
          team: newUser.role,
          role:newUser.subrole,
          link:Environment.FRONTEND_URL,
          branch:branch.name,
          password
        });
        let mailLoad = {
          content:html,
          subject:'New User registeration',
          email:newUser.email,
        }
        new Notify().sendMail(mailLoad)
      return Promise.resolve(branch as BranchInterface);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchBranches(query:QueryInterface):Promise<BranchInterface[]|undefined>{
    try {
      const branches = await this.branch.find(query);
      return Promise.resolve(branches);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async createProduct(data:NewProductInterface, user:UserInterface):Promise<ProductInterface|undefined>{
    try {
      let findProduct = await this.product.findOne({
        partNumber:data.partNumber,
        asnlNumber:data.asnlNumber
      });
      // if(findProduct) {
      //   throw new BadInputFormatException('this product serial number, asnl number and part number is already in the system');
      // }
      let sn;
      let documents = await this.product.find()
      let docs = documents.map(doc=> doc.serialNumber);
      //@ts-ignore
      let maxNumber = Math.max(...docs);
      sn = maxNumber + 1
      let product = await this.product.create({
        ...data,
        serialNumber:sn|1
      });
      const branch = await this.branch.findById(user.branch);
      branch?.products.push(product._id);
      return Promise.resolve(product);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchProducts(query:QueryInterface, user:UserInterface): Promise<ProductInterface[]|undefined>{
    try {
      const products = await this.product.find(query);
      // console.log(products);
      return Promise.resolve(products);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchProduct(id:string, user:UserInterface):Promise<ProductInterface|undefined>{
    try {
      const product = await this.product.findById(id);
      return Promise.resolve(product as ProductInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async updateProduct(productId:string,data:NewProductInterface):Promise<ProductInterface|undefined>{
    try {
      const product = await this.product.findByIdAndUpdate(productId,{$set:data}, {new:true});
      return Promise.resolve(product as ProductInterface);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async deleteProduct(productId:string):Promise<DeleteResponse|undefined>{
    try {
      const product = await this.product.findById(productId);
      if(!product){
        throw new BadInputFormatException('product not found')
      }
      await product.remove();
      return Promise.resolve({
        message:'Product deleted'
      })
    } catch (e) {
      this.handleException(e);
    }
  }

  public async createSupplier(data:NewSupplierInterface, user:UserInterface):Promise<SupplierInterface|undefined>{
    try {
      const supplier = await this.supplier.create(data);
      return Promise.resolve(supplier);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSuppliers(query:QueryInterface):Promise<SupplierInterface[]|undefined>{
    try {
      const suppliers = await this.supplier.find(query);
      return Promise.resolve(suppliers);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async updateSupplier(supplierId:string, data:NewSupplierInterface):Promise<SupplierInterface|undefined>{
    try {
      const supplier = await this.supplier.findByIdAndUpdate(supplierId,{$set:data},{new:true});
      return Promise.resolve(supplier as SupplierInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async removeSupplier(supplierId:string):Promise<DeleteResponse|undefined>{
    try {
      const supplier = await this.supplier.findById(supplierId);
      if(!supplier) {
        throw new BadInputFormatException('Supplier not found');
      }
      await supplier.remove();
      return Promise.resolve({
        message:'deleted successfully'
      })
    } catch (e) {
      this.handleException(e);
    }
  }

  public async addInventory(data:NewInventory):Promise<InventoryInterface|undefined> {
    try {
      const inventory = new this.inventory(data);
      let products = inventory.products;

      for(let product of products) {
        let prod = await this.product.findOne({serialNumber: product.productNumber});
        //@ts-ignore
        prod?.quantity + product.passed;
        //@ts-ignore
        await prod?.save()
      }
      await inventory.save();
      return Promise.resolve(inventory);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async disburseProduct(data:NewDisburseInterface, user:UserInterface):Promise<DisburseProductInterface|undefined>{
    try {
      if(data.nextApprovalOfficer == null) {
        throw new BadInputFormatException('please select the next approval stage officer');
      }
      const disbursement = new this.disburse(data);
      let track = {
        title:"initiate disbursement",
        stage:stagesOfApproval.STAGE1,
        status:ApprovalStatus.APPROVED,
        approvalOfficer:user._id
      }
      disbursement.tracking.push(track);
      disbursement.approvalOfficers.push({
        name:user.name,
        id:user._id,
        office:user.subrole,
        department:user.role,
        stageOfApproval:stagesOfApproval.STAGE1
      });
      disbursement.requestApproval = TransferStatus.PENDING
      disbursement.requestStage = stagesOfApproval.STAGE1
      disbursement.comments.push({
        comment:data.comment,
        commentBy:user._id
      });
      await disbursement.save();
      return Promise.resolve(disbursement);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async approveDisbursment(data:ApprovalInput, user:UserInterface):Promise<DisburseProductInterface|undefined> {
    try {
      const disbursement = await this.disburse.findById(data.id);
      //@ts-ignore
      disbursement?.products = data.products;
      await disbursement?.save();
      if(data.status == ApprovalStatus.REJECTED) {
        if(disbursement?.approvalStage == stagesOfApproval.STAGE1) {
          let AO = disbursement.approvalOfficers.filter(officer=> officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Corrections",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.REJECTED,
            approvalOfficer:AO[0].id
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          disbursement.tracking.push(track);
          disbursement.approvalStage = stagesOfApproval.START;
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          return Promise.resolve(disbursement)
        } else if(disbursement?.approvalStage == stagesOfApproval.STAGE2){
          let AO = disbursement.approvalOfficers.filter(officer=> officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Corrections",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.REJECTED,
            approvalOfficer:AO[0].id
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          disbursement.tracking.push(track);
          disbursement.approvalStage = stagesOfApproval.STAGE1;
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          return Promise.resolve(disbursement)
        } else if(disbursement?.requestStage == stagesOfApproval.STAGE1){
          let AO = disbursement.approvalOfficers.filter(officer=> officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Corrections",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.REJECTED,
            approvalOfficer:AO[0].id
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            });
          }
          disbursement.tracking.push(track);
          disbursement.requestStage = stagesOfApproval.START;
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          return Promise.resolve(disbursement)
        }else if(disbursement?.requestStage == stagesOfApproval.STAGE2){
          let AO = disbursement.approvalOfficers.filter(officer=> officer.stageOfApproval == stagesOfApproval.STAGE1);
          let track = {
            title:"Corrections",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.REJECTED,
            approvalOfficer:AO[0].id
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`)
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            });
          }
          disbursement.tracking.push(track);
          disbursement.requestStage = stagesOfApproval.STAGE1;
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          return Promise.resolve(disbursement)
        }
      }else {
        if(disbursement?.approvalStage == stagesOfApproval.START) {
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            })
          }
          //@ts-ignore
          disbursement.tracking.push(track)
          disbursement.approvalStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          disbursement.nextApprovalOfficer = data.nextApprovalOfficer
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await disbursement.save();
          return Promise.resolve(disbursement)
        }else if(disbursement?.approvalStage == stagesOfApproval.STAGE1){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          disbursement.tracking.push(track)
          disbursement.approvalStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          disbursement.nextApprovalOfficer = data.nextApprovalOfficer
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await disbursement.save();
          return Promise.resolve(disbursement);
        } else if(disbursement?.approvalStage == stagesOfApproval.STAGE2){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);

          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            })
          }
          //@ts-ignore
          disbursement.tracking.push(track);
          disbursement.approvalStage = stagesOfApproval.APPROVED;
          disbursement.disburseStatus = TransferStatus.COMPLETED;
          //@ts-ignore
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          return Promise.resolve(disbursement)
        }else if(disbursement?.requestStage == stagesOfApproval.START) {
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE1
            })
          }
          //@ts-ignore
          disbursement.tracking.push(track)
          disbursement.requestStage = stagesOfApproval.STAGE1;
          //@ts-ignore
          disbursement.nextApprovalOfficer = data.nextApprovalOfficer
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await disbursement.save();
          return Promise.resolve(disbursement)
        }else if(disbursement?.requestStage == stagesOfApproval.STAGE1){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);
          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE2
            })
          }
          //@ts-ignore
          disbursement.tracking.push(track)
          disbursement.requestStage = stagesOfApproval.STAGE2;
          //@ts-ignore
          disbursement.nextApprovalOfficer = data.nextApprovalOfficer
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await disbursement.save();
          return Promise.resolve(disbursement);
        } else if(disbursement?.requestStage == stagesOfApproval.STAGE2){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:data.nextApprovalOfficer
          }
          let checkOfficer = disbursement.approvalOfficers.filter(officer=> `${officer.id}` == `${user._id}`);

          if(checkOfficer.length == 0) {
            disbursement.approvalOfficers.push({
              name:user.name,
              id:user._id,
              office:user.subrole,
              department:user.role,
              stageOfApproval:stagesOfApproval.STAGE3
            })
          }
          //@ts-ignore
          disbursement.tracking.push(track);
          disbursement.requestStage = stagesOfApproval.APPROVED;
          disbursement.requestApproval = TransferStatus.COMPLETED;
          disbursement.approvalStage = stagesOfApproval.START
          disbursement.disburseStatus = TransferStatus.PENDING
          //@ts-ignore
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          return Promise.resolve(disbursement)
        }
      }
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchusersDisburseApprovals(query:QueryInterface,user:UserInterface):Promise<DisburseProductInterface[]|undefined>{
    try {
      const disbursement = await this.disburse.find(query);
      const pendingDisbursement = disbursement.filter(disburse=> disburse.disburseStatus == TransferStatus.PENDING);
      let startStage = pendingDisbursement.filter(transfer=> {
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
      let stage1 = pendingDisbursement.filter(transfer=>{
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
      let stage2 = pendingDisbursement.filter(transfer=>{
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
      let disbursements;
      if(user.subrole == 'superadmin'){
        disbursements = stage2;
      }else if(user.subrole == 'head of department'){
        disbursements = stage1
      }else {
        disbursements = startStage;
      }
      return Promise.resolve(disbursements)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchusersDisburseRequests(query:QueryInterface,user:UserInterface):Promise<DisburseProductInterface[]|undefined>{
    try {
      const disbursement = await this.disburse.find(query);
      const pendingDisbursement = disbursement.filter(disburse=> disburse.requestApproval == TransferStatus.PENDING);
      let startStage = pendingDisbursement.filter(transfer=> {
        if(transfer.requestStage == stagesOfApproval.START) {
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
      let stage1 = pendingDisbursement.filter(transfer=>{
        if(transfer.requestStage == stagesOfApproval.STAGE1) {
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
      let stage2 = pendingDisbursement.filter(transfer=>{
        if(transfer.requestStage == stagesOfApproval.STAGE2) {
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
      let disbursements;
      if(user.subrole == 'superadmin'){
        disbursements = stage2;
      }else if(user.subrole == 'head of department'){
        disbursements = stage1
      }else {
        disbursements = startStage;
      }
      return Promise.resolve(disbursements)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDisbursement(id:string):Promise<DisburseProductInterface|undefined>{
    try {
      const disbursement = await this.disburse.findById(id);
      return Promise.resolve(disbursement as DisburseProductInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDisburseRequests(query:QueryInterface):Promise<DisbursePoolResponse|undefined>{
    try {
      const disbursements = await this.disburse.find(query);
      let totalApproved = disbursements.filter(
        transfer=>transfer.disburseStatus == TransferStatus.COMPLETED
      );
    let totalPending = disbursements.filter(
      transfer=>transfer.disburseStatus == TransferStatus.PENDING
    );
    return Promise.resolve({
      disburse:disbursements,
      count:{
        totalApproved:totalApproved.length | 0,
        totalPending:totalPending.length,
        totalDisbursements:disbursements.length
      }
    });
    } catch (error) {
      this.handleException(error);
    }
  }

  public async fetchProductRequests(query:QueryInterface):Promise<DisbursePoolResponse|undefined>{
    try{
      const disbursements = await this.disburse.find(query);
      let totalApproved = disbursements.filter(
        transfer=>transfer.requestApproval == TransferStatus.COMPLETED
      );
    let totalPending = disbursements.filter(
      transfer=>transfer.requestApproval == TransferStatus.PENDING
    );
    return Promise.resolve({
      disburse:disbursements,
      count:{
        totalApproved:totalApproved.length | 0,
        totalPending:totalPending.length | 0,
        totalDisbursements:disbursements.length|0
      }
    });
    }catch(e){
      this.handleException(e);
    }
  }


  public async disburseReport(query:QueryInterface):Promise<DisburseProductInterface[]|undefined>{
    try {
      const disbursements = await this.disburse.find(query);
      let completed = disbursements.filter(disburse=> disburse.disburseStatus == TransferStatus.COMPLETED);
      return Promise.resolve(completed)
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Product;
