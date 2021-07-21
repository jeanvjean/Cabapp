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
import { generateNumber, generateToken, padLeft } from "../../util/token";
import Module, { QueryInterface } from "../module";
import Environment from '../../configs/static';
import Notify from '../../util/mail'
import { DeleteResponse } from "../vehicle";
import { createLog } from "../../util/logs";
import { mongoose } from "../cylinder";
import { CustomerInterface } from "../../models/customer";

interface ProductProp {
  product:Model<ProductInterface>
  supplier:Model<SupplierInterface>
  inventory:Model<InventoryInterface>
  disburse:Model<DisburseProductInterface>
  branch:Model<BranchInterface>
  user:Model<UserInterface>
  customer:Model<CustomerInterface>
}

interface ApprovalInput{
  comment:string,
  status:string,
  id:string,
  fromBranch?:DisburseProductInterface['fromBranch'],
  password:string,
  products?:DisburseProductInterface['products']
  releasedBy?:DisburseProductInterface['releasedBy']
  releasedTo?:DisburseProductInterface['releasedTo']
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
  products:string,
  grnDocument:string,
  direction:string
}

interface NewDisburseInterface{
  products:DisburseProduct[]
  releasedBy:DisburseProductInterface['releasedBy']
  releasedTo:DisburseProductInterface['releasedTo']
  comment:string
  nextApprovalOfficer:string
  customer:DisburseProductInterface['customer']
  jobTag:DisburseProductInterface['jobTag'],
  mrn:DisburseProductInterface['mrn']
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

interface InventoryPoolResponse {
  inventory:InventoryInterface[]
}


class Product extends Module{
  private product:Model<ProductInterface>
  private supplier:Model<SupplierInterface>
  private inventory:Model<InventoryInterface>
  private disburse:Model<DisburseProductInterface>
  private branch:Model<BranchInterface>
  private user:Model<UserInterface>
  private customer:Model<CustomerInterface>

  constructor(props:ProductProp) {
    super()
    this.product = props.product
    this.supplier = props.supplier
    this.inventory = props.inventory
    this.disburse = props.disburse
    this.branch = props.branch
    this.user = props.user
    this.customer = props.customer
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
          email:newUser.email,
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
      //@ts-ignore
      const branches = await this.branch.find({});
      return Promise.resolve(branches);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async createProduct(data:NewProductInterface, user:UserInterface):Promise<ProductInterface|undefined>{
    try {
      const {  partNumber } = data;
      let findProduct = await this.product.findOne({partNumber, branch:user.branch});
      if(findProduct) {
        throw new BadInputFormatException('a product with this part number already exists in your branch');
      }

      let product = new this.product({...data, branch:user.branch});

      let findP = await this.product.find({}).sort({serialNumber:-1}).limit(1);
      let sn;
      if(findP.length > 0) {
        //@ts-ignore
        sn = findP[0].serialNumber+1;
      }else{
        sn = 1
      }
      //@ts-ignore
      product.serialNumber = sn
      if(product.quantity > 0) {
        product.inStock = true;
        product.outOfStock = false
      } else {
        product.inStock = false
        product.outOfStock = true
      }
      await product.save();
      await createLog({
        user:user._id,
        activities:{
          title:'Inventory',
          //@ts-ignore
          activity:`You Added a new product to product list`,
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(product);
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchProducts(query:QueryInterface, user:UserInterface): Promise<ProductInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter, instock, out } = query;
      const options = {
        ...query,
        populate:[
          {path:'supplier', model:'supplier'},
          {path:'branch', model:'branches'},
          {path:'division', model:'branches'}
        ]
      }
      let aggregate
      const aggregate1 = this.product.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {productName:{
                    $regex: search?.toLowerCase() || ''
                  }},{inStock:{
                    $regex: search?.toLowerCase() || ''
                  }},{outOfStock:{
                    $regex: search?.toLowerCase() || ''
                  }}
                ]
              },
              {branch: ObjectId(user.branch.toString())},
              {deleted: false}
            ]
          }
        }
      ]);
      const aggregate2 = this.product.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {productName:{
                    $regex: search?.toLowerCase() || ''
                  }},{inStock:{
                    $regex: search?.toLowerCase() || ''
                  }},{outOfStock:{
                    $regex: search?.toLowerCase() || ''
                  }}
                ]
              },
              {branch: ObjectId(user.branch.toString())},
              {quantity: {$lt:1}},
              {deleted: false}
            ]
          }
        }
      ]);
      const aggregate3 = this.product.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                  {productName:{
                    $regex: search?.toLowerCase() || ''
                  }},{inStock:{
                    $regex: search?.toLowerCase() || ''
                  }},{outOfStock:{
                    $regex: search?.toLowerCase() || ''
                  }}
                ]
              },
              {branch: ObjectId(user.branch.toString())},
              {quantity: {$gt:0}},
              {deleted: false}
            ]
          }
        }
      ]);
      if(out?.length) {
        aggregate = aggregate2
      }else if(instock?.length) {
        aggregate = aggregate3
      }else {
        aggregate = aggregate1
      }
      //@ts-ignore
      const products = await this.product.aggregatePaginate(aggregate,options);
      //Populate reference fields
      for(let product of products.docs) {
        let supplier = await this.supplier.findById(product.supplier);
        product.supplier = supplier;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let division = await this.branch.findById(product.division);
        product.division = division;
      }
      // console.log(products);
      return Promise.resolve(products);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchProduct(id:string, user:UserInterface):Promise<ProductInterface|undefined>{
    try {
      const product = await this.product.findById(id).populate([
        {path:'supplier', model:'supplier'},
        {path:'branch', model:'branches'}
      ]);
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

  public async inventoryStats(user:UserInterface):Promise<any>{
    try {
      const inventories = await this.inventory.find({branch:user.branch});
      const issuedOut = inventories.filter(inventory=> inventory.direction == productDirection.OUT);
      const totalProducts = await this.product.find({branch:user.branch});
      let p1Name = totalProducts[0].productName
      let p1Qty = 0;
      let p1totalInstock = totalProducts[0].quantity
      for(let prod of issuedOut){
        for(let p of prod.products) {
          if(p.productName == p1Name) {
            p1Qty += +p.quantity
          }
        }
      }
      let p2Name = totalProducts[1].productName
      let p2Qty = 0;
      let p2totalInstock = totalProducts[1].quantity
      for(let prod of issuedOut){
        for(let p of prod.products) {
          if(p.productName == p2Name) {
            p2Qty += +p.quantity
          }
        }
      }
      let p3Name = totalProducts[1].productName
      let p3Qty = 0;
      let p3totalInstock = totalProducts[1].quantity
      for(let prod of issuedOut){
        for(let p of prod.products) {
          if(p.productName == p3Name) {
            p3Qty += +p.quantity
          }
        }
      }
      return Promise.resolve({
        product1: {
          name:p1Name,
          quantityInStock:p1totalInstock,
          issuedOut:p1Qty
        },
        product2: {
          name:p2Name,
          quantityInStock:p2totalInstock,
          issuedOut:p2Qty
        },
        product3: {
          name:p3Name,
          quantityInStock:p3totalInstock,
          issuedOut:p3Qty
        }
      })
    } catch (e) {
      this.handleException(e)
    }
  }

  public async mrnStats(user:UserInterface):Promise<any>{
    try{
      const disbursal = await this.disburse.find({});
      const issuedOut = await this.inventory.find({});
      const totalIssuedOut = issuedOut.filter(inv=> inv.branch == user.branch && inv.direction == productDirection.OUT).length;
      const totalApproved = disbursal.filter(disb=> disb.fromBranch == user.branch && disb.disburseStatus == TransferStatus.COMPLETED).length;
      const totalPending = disbursal.filter(disb=> disb.fromBranch == user.branch && disb.disburseStatus == TransferStatus.PENDING).length
      return Promise.resolve({
        totalIssuedOut,
        totalApproved,
        totalPending
      });
    }catch(e){
      this.handleException(e)
    }
  }

  public async grnStats(user:UserInterface):Promise<any>{
    try {
      const disbursal = await this.disburse.find({});
      const issuedOut = await this.inventory.find({});
      const totalIssuedOut = issuedOut.filter(inv=> inv.branch == user.branch);
      const totalApproved = disbursal.filter(disb=> disb.fromBranch == user.branch && disb.disburseStatus == TransferStatus.COMPLETED);
      const totalPending = disbursal.filter(disb=> disb.fromBranch == user.branch && disb.disburseStatus == TransferStatus.PENDING)
      return Promise.resolve({
        totalGrn:totalIssuedOut.length |0,
        totalApprovedGrn:totalApproved.length|0,
        totalPendingGrn:totalPending.length|0
      });
    } catch (e) {
      this.handleException(e)
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
      const { search } = query
    // const aggregate = this.supplier.aggregate()
      const options = {
        ...query
      }
      // console.log(search?.length)
      let suppliers;
      if(search?.length !== undefined) {
        //@ts-ignore
        suppliers = await this.supplier.paginate({branch:user.branch,$or:[{supplierType:search}, {productType:search}]},options);
      }else{
        //@ts-ignore
        suppliers = await this.supplier.paginate({branch:user.branch},options);
      }
      // console.log(suppliers);
      return Promise.resolve(suppliers);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchAllSuppliers(user:UserInterface):Promise<SupplierInterface[]|undefined>{
    try{
      const suppliers = await this.supplier.find({branch:user.branch});
      return Promise.resolve(suppliers);
    }catch(e){
      this.handleException(e);
    }
  }

  public async fetchSupplierDetails(supplierId:string):Promise<SupplierInterface|undefined>{
    try {
      const supplier = await this.supplier.findById(supplierId).populate([
        {path:'branch', model:'branches'},
      ]);
      return Promise.resolve(supplier as SupplierInterface);
    } catch (e) {
      this.handleException(e)
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
      data.products = JSON.parse(data.products);
      const inventory = new this.inventory({
        ...data,
        inspectingOfficer:user._id,
        branch:user.branch
      });
      // let num = await generateNumber(6)
      let inv = await this.inventory.find({branch:user.branch}).sort({grInit:-1}).limit(1);
      let initNum
      if(inv[0] == undefined) {
        initNum = 1
      }else {
        initNum = inv[0].grInit+1
      }
      let init = "GRN"
      // let str = ""+initNum
      // let pad = "000000"
      // let ans = pad.substring(0, pad.length - str.length) + str;
      const num = padLeft(initNum, 6, "");
      let grnNo = init+num;
      inventory.grnNo = grnNo;
      inventory.grInit = initNum

      let products = inventory.products;
      if(inventory.direction == productDirection.IN){
        for(let product of products) {
          let prod = await this.product.findOne({partNumber: product.partNumber, branch:user.branch});
          //@ts-ignore
          prod?.quantity += +product.passed;
          //@ts-ignore
          prod?.totalCost = prod?.unitCost * prod?.quantity;
          //@ts-ignore
          await prod?.save()
        }
        await createLog({
          user:user._id,
          activities:{
            title:'Inventory',
            //@ts-ignore
            activity:`You recorded new inventories coming in`,
            time: new Date().toISOString()
          }
        });
      }else if(inventory.direction == productDirection.OUT) {
        for(let product of products) {
          let prod = await this.product.findOne({asnlNumber: product.partNumber, branch:user.branch});
          //@ts-ignore
          prod?.quantity -= +product.quantity;
          //@ts-ignore
          prod?.totalCost = prod?.unitCost * prod?.quantity;
          //@ts-ignore
          await prod?.save()
        }
        await createLog({
          user:user._id,
          activities:{
            title:'Inventory',
            //@ts-ignore
            activity:`You recorded new inventories going out`,
            time: new Date().toISOString()
          }
        });
      }
      await inventory.save();
      return Promise.resolve(inventory);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchAllProducts(query:QueryInterface, user:UserInterface):Promise<ProductInterface[]|undefined>{
    try {
      const products = await this.product.find({branch:user.branch});
      return Promise.resolve(products)
    } catch (e) {
      this.handleException(e)
    }
  }

  public async fetchInventories(query:QueryInterface, user:UserInterface):Promise<InventoryPoolResponse|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'inspectingOfficer', model:'User'},
          {path:'branch', model:'branches'}
        ]
      }
      const aggregate = this.inventory.aggregate([
        {
          $match:{
            $and:[
              {
                $or:[
                    {direction:{
                      $regex: search?.toLowerCase() || ''
                    }},{grnNo:{
                      $regex: search?.toLowerCase() || ''
                    }},{LPOnumber:{
                      $regex: search?.toLowerCase() || ''
                    }},{invoiceNumber:{
                      $regex:search?.toLowerCase() || ''
                    }},{'products.productName':{
                      $regex:search?.toLowerCase() || ''
                    }}
                ]
              },
              {branch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      //@ts-ignore
      const inventories = await this.inventory.aggregatePaginate(aggregate, options);
      //Populate reference fields
      for(let product of inventories.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
      }
      return Promise.resolve({
          inventory:inventories
        });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async viewInventory(inventoryId:string):Promise<InventoryInterface|undefined>{
    try {
      const inventory = await this.inventory.findById(inventoryId);
      return Promise.resolve(inventory as InventoryInterface)
    } catch (e) {
      this.handleException(e);
    }
  }

  public async disburseProduct(data:NewDisburseInterface, user:UserInterface):Promise<DisburseProductInterface|undefined>{
    try {
      let hod = await this.user.findOne({
        role:user.role,
        subrole:'head of department',
        branch:user.branch
      });
      const disbursement = new this.disburse({
        ...data,
        nextApprovalOfficer:hod?._id,
        initiator:user._id,
        branch:user.branch,
        requestDepartment:user.role
      });
      let finGrn = await this.disburse.find({}).sort({grnInit:-1}).limit(1);
      let initGrn;
      if(finGrn[0]) {
        if(finGrn[0].grnInit) {
          initGrn = finGrn[0].grnInit+1;
        }else {
          initGrn = 1
        }
      }else {
        initGrn = 1
      }
      let mrn = "MRN"
      let init = "GRN"
      let num = await padLeft(initGrn, 6, "");
      //@ts-ignore
      disbursement.grnNo = init+num;
      disbursement.mrn = mrn+num;
      console.log(initGrn)
      disbursement.grnInit = initGrn;
      console.log(disbursement)
      let track = {
        title:"initiate disbursal process",
        stage:stagesOfApproval.STAGE1,
        status:ApprovalStatus.APPROVED,
        approvalOfficer:user._id
      }

    // "quantityReleased": 15,  pass this when the approvalStage is "start"
    // "comment": "i cannot give them ok"  pass this when the approvalStage is is on any level

    // "nextApprovalOfficer": "60f023245cd89a8a231d46f1" pass this when the requestStage is "stage2",
    // "releasedBy":"60a6d988ee959d2e8c9f02fb", pass this when the approvalStage is "start"
    // "releasedTo":"60a7af1460653206389e9bcd",pass this when the approvalStage is "start"

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
      await createLog({
        user:user._id,
        activities:{
          title:'Product disbursal',
          activity:`You started a product disbursal process`,
          time: new Date().toISOString()
        }
      });
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
      const disbursement = await this.disburse.findById(data.id).populate({
        path:'initiator', model:'User'
      });
      if(!disbursement) {
        throw new BadInputFormatException('product disbursal not found')
      }
      //@ts-ignore
      disbursement?.products = data.products;
      if(data.releasedTo !== null && data.releasedBy !== null) {
        //@ts-ignore
        disbursement?.releasedBy = data.releasedBy;
        //@ts-ignore
        disbursement?.releasedTo = data.releasedTo;
      }
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          let apUser = await this.user.findById(disbursement.nextApprovalOfficer);
          await new Notify().push({
            subject: "Product disbursal",
            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
            user: apUser
          });
          return Promise.resolve(disbursement)
        }
      }else {
        let ObjectId = mongoose.Types.ObjectId;
        let hod = await this.user.findOne({branch:user.branch, subrole:'head of department', role:user.role}).populate({
          path:'branch', model:'branches'
        });
        let newBranchApprovalOfficer = await this.user.findOne({branch:data.fromBranch, subrole:'sales executive', role:"sales"});
        // console.log(newBranchApprovalOfficer);
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Approved a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Approved a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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

          // for(let product of disbursement.products) {
          //   let pro = await this.product.findOne({asnlNumber:product.productNumber, branch:user.branch});
          //   //@ts-ignore
          //   pro?.quantity -= +product.quantityReleased;
          //   await pro?.save();
          // }

          //@ts-ignore
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Approved a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Approved a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Approved a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
            nextApprovalOfficer:newBranchApprovalOfficer?._id
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
          let nb = await this.user.findById(newBranchApprovalOfficer?._id);
          //@ts-ignore
          disbursement.nextApprovalOfficer = newBranchApprovalOfficer._id;
          // console.log(disbursement)
          //@ts-ignore
          disbursement.fromBranch = data.fromBranch;

          //@ts-ignore
          disbursement.comments.push({
            comment:data.comment,
            commentBy:user._id
          });
          await disbursement.save();
          await createLog({
            user:user._id,
            activities:{
              title:'Product Disbursal',
              //@ts-ignore
              activity:`You Approved a disbursal approval request from ${disbursement.initiator.name}`,
              time: new Date().toISOString()
            }
          });
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
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
        ]
      }
      const aggregate = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {disburseStatus:TransferStatus.PENDING},
              {nextApprovalOfficer:ObjectId(user._id.toString())},
              {fromBranch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      //@ts-ignore
      const disbursement = await this.disburse.aggregatePaginate(aggregate,options);
      //Populate reference fields
      for(let product of disbursement.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let initiator = await this.user.findById(product.initiator);
        product.initiator = initiator;
        let customer = await this.customer.findById(product.customer);
        product.customer = customer;
        let releasedTo = await this.user.findById(product.releasedTo);
        product.releasedTo = releasedTo;
        let releasedBy = await this.user.findById(product.releasedBy);
        product.releasedBy = releasedBy;
      }
      // let startStage = disbursement.filter(transfer=> {
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
      // let stage1 = disbursement.filter(transfer=>{
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
      // let stage2 = disbursement.filter(transfer=>{
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
      // let disb;
      // if(user.subrole == 'superadmin'){
      //   disb = stage2;
      // }else if(user.subrole == 'head of department'){
      //   disb = stage1
      // }else {
      //   disb = startStage;
      // }
      return Promise.resolve(disbursement);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchusersDisburseRequests(query:QueryInterface,user:UserInterface):Promise<DisburseProductInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
        ]
      }
      const aggregate = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {requestApproval:TransferStatus.PENDING},
              {nextApprovalOfficer:ObjectId(user._id.toString())},
              {branch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      //@ts-ignore
      const disbursement = await this.disburse.aggregatePaginate(aggregate, options);
      for(let product of disbursement.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let initiator = await this.user.findById(product.initiator);
        product.initiator = initiator;
        let customer = await this.customer.findById(product.customer);
        product.customer = customer;
        let releasedTo = await this.user.findById(product.releasedTo);
        product.releasedTo = releasedTo;
        let releasedBy = await this.user.findById(product.releasedBy);
        product.releasedBy = releasedBy;
      }
      //   console.log(disbursement)
      // let startStage = disbursement.filter(transfer=> {
      //   if(transfer.requestStage == stagesOfApproval.START) {
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
      // let stage1 = disbursement.filter(transfer=>{
      //   if(transfer.requestStage == stagesOfApproval.STAGE1) {
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
      // let stage2 = disbursement.filter(transfer=>{
      //   if(transfer.requestStage == stagesOfApproval.STAGE2) {
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
      // let disb;
      // if(user.subrole == 'superadmin'){
      //   disb = stage2;
      // }else if(user.subrole == 'head of department'){
      //   disb = stage1
      // }else {
      //   disb = startStage;
      // }
      return Promise.resolve(disbursement);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDisbursement(id:string):Promise<DisburseProductInterface|undefined>{
    try {
      const disbursement = await this.disburse.findById(id).populate([
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
      ]);
      return Promise.resolve(disbursement as DisburseProductInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchDisburseRequests(query:QueryInterface, user:UserInterface):Promise<DisbursePoolResponse|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
        ]
      }
      let aggregate;
      const aggregate1 = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {disburseStatus: filter?.toLowerCase()},
              {fromBranch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {fromBranch:ObjectId(user.branch.toString())}
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
      const disbursements = await this.disburse.aggregatePaginate(aggregate, options);
      for(let product of disbursements.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let initiator = await this.user.findById(product.initiator);
        product.initiator = initiator;
        let customer = await this.customer.findById(product.customer);
        product.customer = customer;
        let releasedTo = await this.user.findById(product.releasedTo);
        product.releasedTo = releasedTo;
        let releasedBy = await this.user.findById(product.releasedBy);
        product.releasedBy = releasedBy;
      }

      let totalApproved = await this.disburse.find({branch:user.branch, disburseStatus:TransferStatus.COMPLETED});
    let totalPending =  await this.disburse.find({branch:user.branch, disburseStatus:TransferStatus.PENDING});
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
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
        ]
      }
      let aggregate;
      const aggregate1 = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {disburseStatus: filter?.toLowerCase()},
              {branch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      const aggregate2 = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {branch:ObjectId(user.branch.toString())}
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
      const disbursements = await this.disburse.aggregatePaginate(aggregate, options);
      for(let product of disbursements.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let initiator = await this.user.findById(product.initiator);
        product.initiator = initiator;
        let customer = await this.customer.findById(product.customer);
        product.customer = customer;
        let releasedTo = await this.user.findById(product.releasedTo);
        product.releasedTo = releasedTo;
        let releasedBy = await this.user.findById(product.releasedBy);
        product.releasedBy = releasedBy;
      }

      let totalApproved = await this.disburse.find({branch:user.branch, requestApproval:TransferStatus.COMPLETED});
      let totalPending = await this.disburse.find({branch:user.branch, requestApproval:TransferStatus.PENDING});
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
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
        ]
      }

      const aggregate = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {disburseStatus:TransferStatus.COMPLETED},
              {fromBranch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      //@ts-ignore
      const disbursements = await this.disburse.aggregatePaginate(aggregate, options);
      for(let product of disbursements.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let initiator = await this.user.findById(product.initiator);
        product.initiator = initiator;
        let customer = await this.customer.findById(product.customer);
        product.customer = customer;
        let releasedTo = await this.user.findById(product.releasedTo);
        product.releasedTo = releasedTo;
        let releasedBy = await this.user.findById(product.releasedBy);
        product.releasedBy = releasedBy;
      }
      return Promise.resolve(disbursements);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async restockReport(query:QueryInterface, user:UserInterface):Promise<DisburseProductInterface[]|undefined>{
    try {
      const ObjectId = mongoose.Types.ObjectId
      const { search, filter } = query;
      const options = {
        ...query,
        populate:[
          {path:'nextApprovalOffice', model:'User'},
          {path:'initiator', model:'User'},
          {path:'branch', model:'branches'},
          {path:'customer', model:'customer'},
          {path:'releasedTo', model:'User'},
          {path:'releasedBy', model:'User'}
        ]
      }

      const aggregate = this.disburse.aggregate([
        {
          $match:{
            $and:[
              {$or:[
                {grnNo:{
                  $regex: search?.toLowerCase() || ''
                }},{mrn:{
                  $regex: search?.toLowerCase() || ''
                }},{jobTag:{
                  $regex: search?.toLowerCase() || ''
                }}
              ]},
              {disburseStatus:TransferStatus.COMPLETED},
              {branch:ObjectId(user.branch.toString())}
            ]
          }
        }
      ]);
      //@ts-ignore
      const disbursements = await this.disburse.aggregatePaginate(aggregate, options);
      for(let product of disbursements.docs) {
        let inspectingOfficer = await this.user.findById(product.inspectingOfficer);
        product.inspectingOfficer = inspectingOfficer;
        let branch = await this.branch.findById(product.branch);
        product.branch = branch;
        let initiator = await this.user.findById(product.initiator);
        product.initiator = initiator;
        let customer = await this.customer.findById(product.customer);
        product.customer = customer;
        let releasedTo = await this.user.findById(product.releasedTo);
        product.releasedTo = releasedTo;
        let releasedBy = await this.user.findById(product.releasedBy);
        product.releasedBy = releasedBy;
      }
      return Promise.resolve(disbursements);
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Product;
