import { Model, Schema } from "mongoose";
import { BadInputFormatException } from "../../exceptions";
import { BranchInterface } from "../../models/branch";
import { DisburseProduct, DisburseProductInterface } from "../../models/disburseStock";
import { ProductInterface } from "../../models/inventory";
import { InventoryInterface, productDirection, ReceivedProduct } from "../../models/receivedProduct";
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
import { compareSync } from "bcryptjs";

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
  productName?:string,
  supplier?:ProductInterface['supplier']
}

interface updateProduct {
  asnlNumber?:ProductInterface['asnlNumber']
  partNumber?:ProductInterface['partNumber']
  quantity?:ProductInterface['quantity']
  unitCost?:ProductInterface['unitCost']
  totalCost?:ProductInterface['totalCost']
  location?:ProductInterface['location']
  productName?:ProductInterface['productName'],
  supplier?:ProductInterface['supplier']
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
  grnDocument:string,
  direction:string
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
      let findProduct = await this.product.findOne({asnlNumber:data.asnlNumber, branch:user.branch});
      if(findProduct) {
        throw new BadInputFormatException('a product with this ASNL number already exists in your branch');
      }

      let product = new this.product({...data});
      let findP = await this.product.find({})
      product.serialNumber = findP.length + 1;
      product.branch = user.branch;
      // const branch = await this.branch.findById(user.branch);
      // branch?.products.push(product._id);
      await product.save();
      return Promise.resolve(product);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchProducts(query:QueryInterface, user:UserInterface): Promise<ProductInterface[]|undefined>{
    try {
      const products = await this.product.find({...query, branch:user.branch, deleted:false});
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

  public async updateProduct(productId:string,data:updateProduct):Promise<ProductInterface|undefined>{
    try {
      const product = await this.product.findByIdAndUpdate(
          productId,
          {
            $set:data
          },
          {new:true
        });
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
      product.deleted = true;
      return Promise.resolve({
        message:'Product deleted'
      })
    } catch (e) {
      this.handleException(e);
    }
  }

  public async createSupplier(data:NewSupplierInterface, user:UserInterface):Promise<SupplierInterface|undefined>{
    try {
      const supplier = await this.supplier.create({...data,branch:user.branch});
      return Promise.resolve(supplier);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSuppliers(query:QueryInterface, user:UserInterface):Promise<SupplierInterface[]|undefined>{
    try {
      const suppliers = await this.supplier.find({...query, branch:user.branch});
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

  public async addInventory(data:NewInventory, user:UserInterface):Promise<InventoryInterface|undefined> {
    try {
      const inventory = new this.inventory({...data, inspectingOfficer:user._id});
      let products = inventory.products;
      if(inventory.direction == productDirection.IN){
        for(let product of products) {
          let prod = await this.product.findOne({asnlNumber: product.productNumber, branch:user.branch});
          //@ts-ignore
          prod?.quantity += +product.passed;
          //@ts-ignore
          prod?.totalCost = prod?.unitCost * prod?.quantity;
          //@ts-ignore
          await prod?.save()
        }
      }else if(inventory.direction == productDirection.OUT) {
        for(let product of products) {
          let prod = await this.product.findOne({asnlNumber: product.productNumber, branch:user.branch});
          //@ts-ignore
          prod?.quantity -= +product.quantity;
          //@ts-ignore
          prod?.totalCost = prod?.unitCost * prod?.quantity;
          //@ts-ignore
          await prod?.save()
        }
      }
      await inventory.save();
      return Promise.resolve(inventory);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async disburseProduct(data:NewDisburseInterface, user:UserInterface):Promise<DisburseProductInterface|undefined>{
    try {
      let hod = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.branch});
      const disbursement = new this.disburse({
        ...data,
        nextApprovalOfficer:hod?._id,
        initiator:user._id,
        branch:user.branch
      });
      let track = {
        title:"initiate disbursal process",
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
      let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal process has been initiated and requires your approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
      return Promise.resolve(disbursement);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async approveDisbursment(data:ApprovalInput, user:UserInterface):Promise<DisburseProductInterface|undefined> {
    try {
      let loginUser = await this.user.findById(user._id).select('+password');
      let matchPWD = await loginUser?.comparePWD(data.password, user.password);
      if(!matchPWD) {
        throw new BadInputFormatException('Incorrect password... please check the password');
      }
      const disbursement = await this.disburse.findById(data.id);
      if(!disbursement) {
        throw new BadInputFormatException('product disbursal not found')
      }
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

          disbursement.nextApprovalOfficer = AO[0].id;
          disbursement.approvalStage = stagesOfApproval.START;
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal you approved was rejected. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
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
          disbursement.nextApprovalOfficer = AO[0].id;
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal you approved was rejected. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
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
          disbursement.nextApprovalOfficer = AO[0].id;
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
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
          disbursement.nextApprovalOfficer = AO[0].id
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
          return Promise.resolve(disbursement)
        }
      }else {
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        if(disbursement?.approvalStage == stagesOfApproval.START) {
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:hod?._id
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
          disbursement.nextApprovalOfficer = hod?._id
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal has been initiated and needs your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
          return Promise.resolve(disbursement)
        }else if(disbursement?.approvalStage == stagesOfApproval.STAGE1){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            //@ts-ignore
            nextApprovalOfficer:hod?.branch.branchAdmin
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
          disbursement.nextApprovalOfficer = hod?.branch.branchAdmin
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal has been initiated and needs your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
          return Promise.resolve(disbursement);
        } else if(disbursement?.approvalStage == stagesOfApproval.STAGE2){
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE3,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            // nextApprovalOfficer:data.nextApprovalOfficer
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

          for(let product of disbursement.products) {
            let pro = await this.product.findOne({asnlNumber:product.productNumber, branch:user.branch});
            //@ts-ignore
            pro?.quantity - +product.quantityReleased;
            await pro?.save();
          }

          //@ts-ignore
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.initiator);
          await new Notify().push({
            subject: "Product disbursal",
            content: `product disbursal request has been approved. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
          return Promise.resolve(disbursement)
        }else if(disbursement?.requestStage == stagesOfApproval.START) {
          //@ts-ignore
          const branchApproval = await this.user.findOne({role:user.role, subrole:'head of department', branch:user.role});
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE1,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            nextApprovalOfficer:branchApproval?._id
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
          disbursement.nextApprovalOfficer = branchApproval?._id
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          })
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal request initiated and needs your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
          return Promise.resolve(disbursement)
        }else if(disbursement?.requestStage == stagesOfApproval.STAGE1){
          let brenchRequestApproval = await this.user.findOne({branch:user.branch, subrole:'head of department'}).populate({
            path:'branch', model:'branches'
          });
          // console.log(brenchRequestApproval)
          let track = {
            title:"Approval Prorcess",
            stage:stagesOfApproval.STAGE2,
            status:ApprovalStatus.APPROVED,
            dateApproved:new Date().toISOString(),
            approvalOfficer:user._id,
            //@ts-ignore
            nextApprovalOfficer:brenchRequestApproval?.branch.branchAdmin
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
          disbursement.nextApprovalOfficer = brenchRequestApproval?.branch.branchAdmin
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal request has been initiated and needs your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
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
            });
          }
          //@ts-ignore
          disbursement.tracking.push(track);
          disbursement.requestStage = stagesOfApproval.APPROVED;
          disbursement.requestApproval = TransferStatus.COMPLETED;
          disbursement.approvalStage = stagesOfApproval.START
          disbursement.disburseStatus = TransferStatus.PENDING

          //set next branch
          let nb = await this.user.findById(data.nextApprovalOfficer);
          //@ts-ignore
          disbursement.nextApprovalOfficer = data.nextApprovalOfficer;
          //@ts-ignore
          disbursement.fromBranch = nb?.branch;

          //@ts-ignore
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal request has been initiated and needs your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
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
      const pendingDisbursement = disbursement.filter(disburse=>
          disburse.disburseStatus == TransferStatus.PENDING && disburse.fromBranch == user.branch
        );
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
      const pendingDisbursement = disbursement.filter(disburse=>
        disburse.requestApproval == TransferStatus.PENDING && disburse.branch == user.branch);
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

  public async fetchDisburseRequests(query:QueryInterface, user:UserInterface):Promise<DisbursePoolResponse|undefined>{
    try {
      const disbursements = await this.disburse.find({...query, branch:user.branch});
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

  public async fetchProductRequests(query:QueryInterface, user:UserInterface):Promise<DisbursePoolResponse|undefined>{
    try{
      const disbursements = await this.disburse.find({...query, branch:user.branch});
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


  public async disburseReport(query:QueryInterface, user:UserInterface):Promise<DisburseProductInterface[]|undefined>{
    try {
      const disbursements = await this.disburse.find({...query, branch:user.branch});
      let completed = disbursements.filter(disburse=> disburse.disburseStatus == TransferStatus.COMPLETED);
      return Promise.resolve(completed)
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Product;
