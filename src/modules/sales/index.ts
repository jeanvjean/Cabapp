/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import {Model} from 'mongoose';
import {SalesRequisitionInterface} from '../../models/sales-requisition';
import {ApprovalStatus, stagesOfApproval, TransferStatus} from '../../models/transferCylinder';
import {UserInterface} from '../../models/user';
import Module, {QueryInterface} from '../module';
import {RegisteredCylinderInterface, TypesOfCylinders} from '../../models/registeredCylinders';
import {BadInputFormatException} from '../../exceptions';
import {PurchaseOrderInterface} from '../../models/purchaseOrder';
import env from '../../configs/static';
import Notify from '../../util/mail';
import {createLog} from '../../util/logs';
import {passWdCheck} from '../../util/token';
import {WalkinCustomerStatus} from '../../models/walk-in-customers';
import {mongoose} from '../cylinder';
import {EcrType, EmptyCylinderInterface} from '../../models/emptyCylinder';
import {cylinderTypes} from '../../models/cylinder';
import {ProductionScheduleInterface} from '../../models/productionSchedule';

// eslint-disable-next-line @typescript-eslint/class-name-casing
interface salesRequisitionProps {
  sales: Model<SalesRequisitionInterface>;
  user: Model<UserInterface>;
  cylinder: Model<RegisteredCylinderInterface>;
  purchase: Model<PurchaseOrderInterface>;
  ecr: Model<EmptyCylinderInterface>;
  productionSchedule: Model<ProductionScheduleInterface>;
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
interface newSaleRequisition{
  customer: SalesRequisitionInterface['customer'];
  ecrNo: SalesRequisitionInterface['ecrNo'];
  date: SalesRequisitionInterface['date'];
  cylinders: SalesRequisitionInterface['cylinders'];
  initiator: SalesRequisitionInterface['initiator'];
  approvalStage: SalesRequisitionInterface['approvalStage'];
  approvalOfficers: SalesRequisitionInterface['approvalOfficers'];
  branch: SalesRequisitionInterface['branch'];
  status: SalesRequisitionInterface['status'];
  cylinderType: SalesRequisitionInterface['cyliderType'];
  type: SalesRequisitionInterface['type'];
  production_id: SalesRequisitionInterface['production_id'];
  purchase_id: SalesRequisitionInterface['purchase_id'];
  fcr_id?: SalesRequisitionInterface['fcr_id'];
}

type SalesApproval = {
  comment: string;
  status: string;
  salesId: string;
  nextApprovalOfficer?: string;
  password: string;
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
interface salesOrderReport {
  orders: SalesRequisitionInterface[];
  completed: SalesRequisitionInterface[];
  pending: SalesRequisitionInterface[];
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
interface purchaseOrderReport{
  orders: PurchaseOrderInterface[];
  completed: PurchaseOrderInterface[];
  pending: PurchaseOrderInterface[];
}


class Sale extends Module {
  private sales: Model<SalesRequisitionInterface>
  private user: Model<UserInterface>
  private cylinder: Model<RegisteredCylinderInterface>
  private purchase: Model<PurchaseOrderInterface>
  private ecr: Model<EmptyCylinderInterface>
  private productionSchedule: Model<ProductionScheduleInterface>

  constructor(props: salesRequisitionProps) {
    super();
    this.sales = props.sales;
    this.user = props.user;
    this.cylinder = props.cylinder;
    this.purchase = props.purchase;
    this.ecr = props.ecr;
    this.productionSchedule = props.productionSchedule;
  }

  public async createSalesRequisition(data: newSaleRequisition, user: UserInterface): Promise<SalesRequisitionInterface|undefined> {
    try {
      const sales = new this.sales(data);
      sales.branch = user.branch;
      sales.status = TransferStatus.PENDING;
      sales.preparedBy = user._id;
      for (const cyl of sales.cylinders) {
        const cylinder = await this.cylinder.findOne({cylinderNumber: cyl.cylinderNumber});
        if (cylinder) {
          if (cylinder.cylinderStatus == WalkinCustomerStatus.EMPTY) {
            throw new BadInputFormatException(`cylinder number ${cyl.cylinderNumber} is empty`);
          }
          cylinder.tracking.push({
            heldBy: 'asnl',
            name: 'Sales',
            location: 'Sales department (sales requisition)',
            date: new Date().toISOString()
          });
          await cylinder.save();
        }
      }
      await sales.save();
      await createLog({
        user: user._id,
        activities: {
          title: 'Sales requisition',
          activity: 'Created a sales requisition awaiting approval',
          time: new Date().toISOString()
        }
      });
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchCustomerFilledCylinders(customerId: string, user: UserInterface): Promise<RegisteredCylinderInterface[] | undefined> {
    try {
      const objectId = mongoose.Types.ObjectId;
      const user_cylinders = await this.cylinder.find({
        // @ts-ignore
        assignedTo: customerId,
        cylinderStatus: WalkinCustomerStatus.FILLED
      }).sort({createdAt: -1});
      return Promise.resolve(user_cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSalesRequisition(query: QueryInterface, user: UserInterface): Promise<SalesRequisitionInterface[]|undefined> {
    try {
      const {customer, fromDate, toDate, gasVolume, search, type} = query;
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        populate: [
          {path: 'initiator', model: 'User'},
          {path: 'nextApprovalOfficer', model: 'User'},
          {path: 'preparedBy', model: 'User'},
          {path: 'customer.id', model: 'customer',
            select: 'vat email phoneNumber rcNumber'}
        ],
        sort: {createdAt: -1}
      };
      let q = {
        branch: user.branch
      };
      const or = [];
      if (customer) {
        // @ts-ignore
        q = {...q, customer: customer};
      }
      if (fromDate) {
        // @ts-ignore
        q = {...q, createdAt: {$gte: new Date(fromDate)}};
      }
      if (toDate) {
        // @ts-ignore
        q = {...q, createdAt: {$lte: new Date(toDate)}};
      }

      if (gasVolume) {
        // @ts-ignore
        q = {...q, 'cylinders.volume': gasVolume};
      }

      if (type) {
        // @ts-ignore
        q = {...q, type: type};
      }

      if (search) {
        or.push({customer: new RegExp(search, 'gi')});
        or.push({gasVolume: new RegExp(search, 'gi')});
        or.push({ecrNo: new RegExp(search, 'gi')});
        or.push({status: new RegExp(search, 'gi')});
      }
      // @ts-ignore
      const sales = await this.sales.paginate(q, options);
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchSalesReqDetails(salesId: string): Promise<SalesRequisitionInterface|undefined> {
    try {
      const sales = await this.sales.findById(salesId).populate([
        {path: 'initiator', model: 'User'},
        {path: 'nextApprovalOfficer', model: 'User'},
        {path: 'preparedBy', model: 'User'},
        {path: 'customer.id', model: 'customer',
          select: 'vat email phoneNumber rcNumber'}
      ]);
      return Promise.resolve(sales as SalesRequisitionInterface);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async approveSalesRequisition(data: SalesApproval, user: UserInterface): Promise<SalesRequisitionInterface|undefined> {
    try {
      await passWdCheck(user, data.password);
      const sales = await this.sales.findById(data.salesId).populate({
        path: 'initiator', model: 'User'
      });
      if (!sales) {
        throw new BadInputFormatException('sales requisition not found');
      }
      if (data.status == ApprovalStatus.REJECTED) {
        if (sales?.approvalStage == stagesOfApproval.STAGE1) {
          const AO = sales.approvalOfficers.filter((officer)=>officer.stageOfApproval == stagesOfApproval.STAGE1);
          const track = {
            title: 'Approval Process',
            stage: stagesOfApproval.STAGE2,
            status: ApprovalStatus.REJECTED,
            dateApproved: new Date().toISOString(),
            approvalOfficer: user._id,
            nextApprovalOfficer: AO[0].id
          };
          const checkOfficer = sales.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
          if (checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name: user.name,
              id: user._id,
              office: user.subrole,
              department: user.role,
              stageOfApproval: stagesOfApproval.STAGE2
            });
          }
          // @ts-ignore
          sales.tracking.push(track);
          sales.approvalStage = stagesOfApproval.START;
          sales.initiated = true;
          sales.initiator = user._id;
          sales.nextApprovalOfficer = AO[0].id;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          await createLog({
            user: user._id,
            activities: {
              title: 'Sales requisition',
              // @ts-ignore
              activity: `rejected a requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          const approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          new Notify().push({
            subject: 'Sales Requisition',
            content: `A Sales requisition you approved failed secondary approval and requires your attention. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
            user: approvalUser
          });
          return Promise.resolve(sales);
        } else if (sales?.approvalStage == stagesOfApproval.STAGE2) {
          const AO = sales.approvalOfficers.filter((officer)=>officer.stageOfApproval == stagesOfApproval.STAGE2);
          const track = {
            title: 'Approval Process',
            stage: stagesOfApproval.STAGE3,
            status: ApprovalStatus.REJECTED,
            dateApproved: new Date().toISOString(),
            approvalOfficer: user._id,
            nextApprovalOfficer: AO[0].id
          };
          const checkOfficer = sales.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
          if (checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name: user.name,
              id: user._id,
              office: user.subrole,
              department: user.role,
              stageOfApproval: stagesOfApproval.STAGE3
            });
          }
          // @ts-ignore
          sales.tracking.push(track);
          sales.approvalStage = stagesOfApproval.STAGE1;
          sales.nextApprovalOfficer = AO[0].id;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          await createLog({
            user: user._id,
            activities: {
              title: 'Sales requisition',
              // @ts-ignore
              activity: `rejected a requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          const approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          new Notify().push({
            subject: 'Sales Requisition',
            content: `A Sales requisition you approved failed secondary approval and requires your attention. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
            user: approvalUser
          });
          return Promise.resolve(sales);
        }
      } else {
        const hod = await this.user.findOne({branch: user.branch, subrole: 'head of department', role: user.role}).populate({
          path: 'branch', model: 'branches'
        });
        // console.log(hod);
        if (sales?.approvalStage == stagesOfApproval.START) {
          const track = {
            title: 'Approval Prorcess',
            stage: stagesOfApproval.STAGE1,
            status: ApprovalStatus.APPROVED,
            dateApproved: new Date().toISOString(),
            approvalOfficer: user._id,
            nextApprovalOfficer: hod?._id
          };

          const checkOfficer = sales.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
          if (checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name: user.name,
              id: user._id,
              office: user.subrole,
              department: user.role,
              stageOfApproval: stagesOfApproval.STAGE1
            });
          }
          // @ts-ignore
          sales.tracking.push(track);

          sales.approvalStage = stagesOfApproval.STAGE1;
          // @ts-ignore
          sales.nextApprovalOfficer = hod?._id;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          await createLog({
            user: user._id,
            activities: {
              title: 'Sales requisition',
              // @ts-ignore
              activity: `Approved a sales requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          const approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          await new Notify().push({
            subject: 'Sales Requisition',
            content: `A Sales requisition has been created and requires your approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
            user: approvalUser
          });
          return Promise.resolve(sales);
        } else if (sales?.approvalStage == stagesOfApproval.STAGE1) {
          const branchAdmin = await this.user.findOne({branch: hod?.branch, subrole: 'superadmin'});
          const track = {
            title: 'Initiate Transfer',
            stage: stagesOfApproval.STAGE2,
            status: ApprovalStatus.APPROVED,
            dateApproved: new Date().toISOString(),
            approvalOfficer: user._id,
            // @ts-ignore
            nextApprovalOfficer: branchAdmin?._id
          };
          // console.log(track);
          const checkOfficer = sales.approvalOfficers.filter((officer)=>`${officer.id}` == `${user._id}`);
          if (checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name: user.name,
              id: user._id,
              office: user.subrole,
              department: user.role,
              stageOfApproval: stagesOfApproval.STAGE2
            });
          }
          // @ts-ignore
          sales.tracking.push(track);
          sales.approvalStage = stagesOfApproval.STAGE2;
          // @ts-ignore
          sales.nextApprovalOfficer = branchAdmin?._id;
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // })
          await sales.save();
          await createLog({
            user: user._id,
            activities: {
              title: 'Sales requisition',
              // @ts-ignore
              activity: `Approved a sales requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          const approvalUser = await this.user.findById(sales.nextApprovalOfficer);
          await new Notify().push({
            subject: 'Sales Requisition',
            content: `A Sales requisition has been created and requires your approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
            user: approvalUser
          });
          return Promise.resolve(sales);
        } else if (sales?.approvalStage == stagesOfApproval.STAGE2) {
          const track = {
            title: 'Initiate Transfer',
            stage: stagesOfApproval.STAGE3,
            status: ApprovalStatus.APPROVED,
            dateApproved: new Date().toISOString(),
            approvalOfficer: user._id,
            // nextApprovalOfficer:data.nextApprovalOfficer
          };
          const checkOfficer = sales.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
          if (checkOfficer.length == 0) {
            sales.approvalOfficers.push({
              name: user.name,
              id: user._id,
              office: user.subrole,
              department: user.role,
              stageOfApproval: stagesOfApproval.STAGE3
            });
          }
          // @ts-ignore
          sales.tracking.push(track);
          sales.approvalStage = stagesOfApproval.APPROVED;
          sales.status = TransferStatus.COMPLETED;

          // transfer.nextApprovalOfficer = data.nextApprovalOfficer
          // sales.comments.push({
          //   comment:data.comment,
          //   commentBy:user._id
          // });
          // console.log(sales);
          await sales.save();
          await createLog({
            user: user._id,
            activities: {
              title: 'Sales requisition',
              // @ts-ignore
              activity: `Approved a sales requisition made by ${sales.initiator.name}`,
              time: new Date().toISOString()
            }
          });
          const approvalUser = await this.user.findById(sales.initiator);
          await new Notify().push({
            subject: 'Sales Requisition',
            content: `A Sales requisition has been approval. click to view ${env.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
            user: approvalUser
          });
          return Promise.resolve(sales);
        }
      }
    } catch (e) {
      this.handleException(e);
    }
  }

  public async fetchPendingRequisitionApproval(query: QueryInterface, user: UserInterface): Promise<SalesRequisitionInterface[]|undefined> {
    try {
      const {stage, page, limit, search, cylinderNumber, cylinderType, fromDate, toDate} = query;
      const options = {
        page: page || 1,
        limit: limit||10,
        sort: {createdAt: -1}
      };
      let q = {
        branch: user.branch,
        status: TransferStatus.PENDING,
        populate: [
          {path: 'initiator', model: 'User'},
          {path: 'branch', model: 'branches'},
          {path: 'preparedBy', model: 'User'},
          {path: 'nextApprovalOfficer', model: 'User'}
        ]
      };
      const or = [];
      if (search) {
        or.push({customerName: new RegExp(search, 'gi')});
        or.push({approvalStage: new RegExp(search, 'gi')});
        or.push({cyliderType: new RegExp(search, 'gi')});
        or.push({cyliderType: new RegExp(search, 'gi')});
        or.push({'cylinders.cylinderNumber': new RegExp(search, 'gi')});
        or.push({'cylinders.volume': new RegExp(search, 'gi')});
      }
      if (stage) {
        // @ts-ignore
        q = {...q, approvalStage: stage};
      }
      if (cylinderNumber) {
        // @ts-ignore
        q = {...q, 'cylinders.cylinderNumber': cylinderNumber};
      }
      if (cylinderType) {
        // @ts-ignore
        q = {...q, 'cylinders.cylinderType': cylinderType};
      }

      if (fromDate) {
        // @ts-ignore
        q = {...q, createdAt: {'$gte': new Date(fromDate)}};
      }
      if (toDate) {
        // @ts-ignore
        q = {...q, createdAt: {'$lte': new Date(toDate)}};
      }
      // @ts-ignore
      const sales = await this.sales.paginate(q, options);
      return Promise.resolve(sales);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async returnedCylinder(cylinderId: string): Promise<RegisteredCylinderInterface|undefined> {
    try {
      const cylinder = await this.cylinder.findById(cylinderId);
      if (!cylinder) {
        throw new BadInputFormatException('cylinder not found');
      }
      cylinder.cylinderType = cylinderTypes.BUFFER;
      await cylinder.save();
      return Promise.resolve(cylinder);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderTransactions(query: QueryInterface, user: UserInterface): Promise<RegisteredCylinderInterface[]|undefined> {
    try {
      const options = {
        ...query,
        populate: [
          {path: 'assignedTo', model: 'customer'}
        ],
        sort: {createdAt: -1}
      };
      // @ts-ignore
      const cylinders = await this.cylinder.paginate({branch: user.branch, cylinderType: cylinderTypes.ASSIGNED}, options);
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async cylinderTransactionsDownload(user: UserInterface): Promise<RegisteredCylinderInterface[]|undefined> {
    try {
      // const options = {
      //   ...query,
      //   populate:[
      //     {path:'assignedTo', model:'customer'}
      //   ]
      // }
      // @ts-ignore
      const cylinders = await this.cylinder.find({branch: user.branch, cylinderType: cylinderTypes.ASSIGNED});
      return Promise.resolve(cylinders);
    } catch (e) {
      this.handleException(e);
    }
  }

  public async salesOrderTransaction(query: QueryInterface, user: UserInterface): Promise<salesOrderReport|undefined> {
    try {
      // @ts-ignore
      const salesOrders = await this.sales.find({branch: user.branch}, {...query});
      // @ts-ignore
      const completed = await this.sales.find({branch: user.branch, status: TransferStatus.COMPLETED}, {...query});
      // @ts-ignore
      const in_progress = await this.sales.find({branch: user.branch, status: TransferStatus.PENDING}, {...query});
      return Promise.resolve({
        orders: salesOrders,
        completed,
        pending: in_progress
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async salesOrderDownload(user: UserInterface): Promise<salesOrderReport|undefined> {
    try {
      // @ts-ignore
      const salesOrders = await this.sales.find({branch: user.branch});
      // @ts-ignore
      const completed = await this.sales.find({branch: user.branch, status: TransferStatus.COMPLETED});
      // @ts-ignore
      const in_progress = await this.sales.find({branch: user.branch, status: TransferStatus.PENDING});
      return Promise.resolve({
        orders: salesOrders,
        completed,
        pending: in_progress
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async purchaseOrderReport(query: QueryInterface, user: UserInterface): Promise<purchaseOrderReport|undefined> {
    try {
      const options = {
        page: query.page || 1,
        limit: query.limit || 10,
        populate: [
          {path: 'nextApprovalOfficer', model: 'User'},
          {path: 'initiator', model: 'User'},
          {path: 'branch', model: 'branches'},
          {path: 'customer', model: 'customer'}
        ],
        sort: {createdAt: -1}
      };
      // @ts-ignore
      const purchaseOrder = await this.purchase.paginate({branch: user.branch}, options);
      // @ts-ignore
      const completed = await this.purchase.paginate({branch: user.branch, approvalStatus: TransferStatus.COMPLETED}, options);
      // @ts-ignore
      const pending = await this.purchase.paginate({branch: user.branch, approvalStatus: TransferStatus.PENDING}, options);
      return Promise.resolve({
        orders: purchaseOrder,
        completed,
        pending
      });
    } catch (e) {
      this.handleException(e);
    }
  }

  public async purchaseReportDowndload(user: UserInterface): Promise<any> {
    try {
      const options = {
        populate: [
          {path: 'nextApprovalOfficer', model: 'User'},
          {path: 'initiator', model: 'User'},
          {path: 'branch', model: 'branches'},
          {path: 'customer', model: 'customer'}
        ],
        sort: {createdAt: -1}
      };
      // @ts-ignore
      const purchaseOrder = await this.purchase.find({branch: user.branch}, options);
      // @ts-ignore
      const completed = await this.purchase.find({branch: user.branch, approvalStatus: TransferStatus.COMPLETED}, options);
      // @ts-ignore
      const pending = await this.purchase.find({branch: user.branch, approvalStatus: TransferStatus.PENDING}, options);
      return Promise.resolve({
        orders: purchaseOrder,
        completed,
        pending
      });
    } catch (e) {
      this.handleException(e);
    }
  }
}

export default Sale;
