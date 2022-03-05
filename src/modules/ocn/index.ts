/* eslint-disable max-lines */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable require-jsdoc */
import Module, {QueryInterface} from '../module';
import {Model} from 'mongoose';
import {note, OutgoingCylinderInterface, statuses} from '../../models/ocn';
import {UserInterface} from '../../models/user';
import {stagesOfApproval, ApprovalStatus, TransferStatus} from '../../models/transferCylinder';
import Notify from '../../util/mail';
import Environment from '../../configs/static';
import {BadInputFormatException} from '../../exceptions';
import {createLog} from '../../util/logs';
import {generateToken, padLeft} from '../../util/token';
import {mongoose} from '../cylinder';
import {CustomerInterface} from '../../models/customer';
import {BranchInterface} from '../../models/branch';
import {saleCylinder} from '../../models/sales-requisition';
import {RegisteredCylinderInterface} from '../../models/registeredCylinders';
import {WayBillInterface} from '../../models/waybill';

interface ocnPropsInterface {
    ocn: Model<OutgoingCylinderInterface>;
    user: Model<UserInterface>;
    customer: Model<CustomerInterface>;
    branch: Model<BranchInterface>;
    cylinder: Model<RegisteredCylinderInterface>;
    delivery: Model<WayBillInterface>;
}

interface newOcnInterface {
    customer?: OutgoingCylinderInterface['customer'];
    supplier?: OutgoingCylinderInterface['supplier'];
    cylinderType?: OutgoingCylinderInterface['cylinderType'];
    otherCylinders?: OutgoingCylinderInterface['otherCylinders'];
    date?: OutgoingCylinderInterface['date'];
    cylinders?: saleCylinder[];
    totalQty?: OutgoingCylinderInterface['totalQty'];
    totalVol?: OutgoingCylinderInterface['totalVol'];
    totalAmount?: OutgoingCylinderInterface['totalAmount'];
    noteType?: OutgoingCylinderInterface['noteType'];
    totalAsnlCylinders?: OutgoingCylinderInterface['totalAsnlCylinders'];
    totalCustomerCylinders?: OutgoingCylinderInterface['totalCustomerCylinders'];
    vehicle?: OutgoingCylinderInterface['vehicle'];
    type?: OutgoingCylinderInterface['type'];
    routePlan?: OutgoingCylinderInterface['routePlan'];
}

interface updateOcnInterface {
  customer?: OutgoingCylinderInterface['customer'];
  supplier?: OutgoingCylinderInterface['supplier'];
  cylinderType?: OutgoingCylinderInterface['cylinderType'];
  otherCylinders?: OutgoingCylinderInterface['otherCylinders'];
  date?: OutgoingCylinderInterface['date'];
  cylinders?: OutgoingCylinderInterface['cylinders'];
  totalQty?: OutgoingCylinderInterface['totalQty'];
  totalVol?: OutgoingCylinderInterface['totalVol'];
  totalAmount?: OutgoingCylinderInterface['totalAmount'];
  noteType?: OutgoingCylinderInterface['noteType'];
  totalAsnlCylinders?: OutgoingCylinderInterface['totalAsnlCylinders'];
  totalCustomerCylinders?: OutgoingCylinderInterface['totalCustomerCylinders'];
  vehicle?: OutgoingCylinderInterface['vehicle'];
  type?: OutgoingCylinderInterface['type'];
  routePlan?: OutgoingCylinderInterface['routePlan'];
}

type ocnApproval = {
    comment: string;
    status: string;
    ocnId: string;
    password: string;
}

class OutGoingCylinder extends Module {
    private ocn: Model<OutgoingCylinderInterface>
    private user: Model<UserInterface>
    private branch: Model<BranchInterface>
    private customer: Model<CustomerInterface>
    private cylinder: Model<RegisteredCylinderInterface>
    private delivery: Model<WayBillInterface>

    constructor(props: ocnPropsInterface) {
      super();
      this.ocn = props.ocn;
      this.user = props.user;
      this.branch = props.branch;
      this.customer = props.customer;
      this.cylinder = props.cylinder;
      this.delivery = props.delivery;
    }

    public async createOCNRecord(data: newOcnInterface, user: UserInterface): Promise<OutgoingCylinderInterface|undefined> {
      try {
        const ocn = new this.ocn(data);
        const hod = await this.user.findOne({branch: user.branch, role: user.role, subrole: 'head of department'});
        ocn.branch = user.branch;
        ocn.nextApprovalOfficer = hod?._id;
        ocn.initiator = user._id;

        if (data.cylinders) {
          for (const cyl of data.cylinders) {
            const cylinder = await this.cylinder.findOne({cylinderNumber: cyl.cylinderNumber});
            if (cylinder) {
              ocn.cylinders.push(cylinder._id);
            }
          }
        }

        ocn.approvalOfficers.push({
          name: user.name,
          id: user._id,
          office: user.subrole,
          department: user.role,
          stageOfApproval: stagesOfApproval.STAGE1
        });
        const findOcn = await this.ocn.find({branch: user.branch}).sort({ocnInit: -1}).limit(1);
        let initNum;
        if (findOcn[0] == undefined) {
          initNum = 1;
        } else {
          initNum = findOcn[0].ocnInit+1;
        }
        let init = 'OCN';
        if (data.noteType == note.IN) {
          init = 'ICN';
        }
        const num = padLeft(initNum, 6, '');
        const grnNo = init+num;
        if (init == 'ICN') {
          ocn.icnNo = grnNo;
          ocn.totalCylinders = ocn.totalAsnlCylinders + ocn.totalCustomerCylinders;
        } else if (init == 'OCN') {
          ocn.ocnNo = grnNo;
        }
        // ocn.ocnNo = grnNo;
        ocn.ocnInit = initNum;
        if (ocn.delivery_ids.length > 0) {
          for (const delivery of ocn.delivery_ids) {
            const d = await this.delivery.findById(delivery);
            if (d) {
              d.ocn_id = ocn._id;
              await d.save();
            }
          }
        }
        await ocn.save();
        await createLog({
          user: user._id,
          activities: {
            title: 'OCN request',
            // @ts-ignore
            activity: `You created a new out going cylinder note awaiting approval`,
            time: new Date().toISOString()
          }
        });
        const apUser = await this.user.findOne({role: 'security', subrole: 'head of department', branch: ocn.branch});
        await new Notify().push({
          subject: 'Outgoing cylinder note (OCN)',
          content: `OCN generated. click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
          user: apUser
        });
        return Promise.resolve(ocn);
      } catch (e) {
        this.handleException(e);
      }
    }

    public async updateOcn(ocnId: string, data: updateOcnInterface, user: UserInterface): Promise<OutgoingCylinderInterface|undefined> {
      try {
        const ocn = await this.ocn.findById(ocnId);
        if (!ocn) {
          throw new BadInputFormatException('ocn not found');
        }
        const updatedOcn = await this.ocn.findByIdAndUpdate(ocnId, {...data, status: statuses.PASSED}, {new: true});
        return Promise.resolve(updatedOcn as OutgoingCylinderInterface);
      } catch (e) {
        this.handleException(e);
      }
    }

    public async approveOcn(data: ocnApproval, user: UserInterface): Promise<OutgoingCylinderInterface|undefined> {
      try {
        const {ocnId, status} = data;
        const ocn = await this.ocn.findById(ocnId).populate({
          path: 'customer', model: 'customer'
        });
        console.log(ocn);
        if (!ocn) {
          throw new BadInputFormatException('OCN not found');
        }
        if (status == ApprovalStatus.REJECTED) {
          if (ocn?.approvalStage == stagesOfApproval.STAGE1) {
            const AO = ocn.approvalOfficers.filter((officer)=>officer.stageOfApproval == stagesOfApproval.STAGE1);
            const checkOfficer = ocn.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
            if (checkOfficer.length == 0) {
              ocn.approvalOfficers.push({
                name: user.name,
                id: user._id,
                office: user.subrole,
                department: user.role,
                stageOfApproval: stagesOfApproval.STAGE2
              });
            }
            // @ts-ignore
            //   transfer.tracking.push(track)
            ocn.approvalStage = stagesOfApproval.START;
            ocn.nextApprovalOfficer = AO[0].id;
            //   ocn.comments.push({
            //     comment:data.comment,
            //     commentBy:user._id
            //   })
            await ocn.save();
            await createLog({
              user: user._id,
              activities: {
                title: 'OCN',
                // @ts-ignore
                activity: `You Rejected an Ocn approval request`,
                time: new Date().toISOString()
              }
            });
            const apUser = await this.user.findById(ocn.nextApprovalOfficer);
            await new Notify().push({
              subject: 'Outgoing cylinder note(OCN)',
              content: `An OCN you initiated has been rejected please check and make adiquate corrections. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
              user: apUser
            });
            return Promise.resolve(ocn);
          } else if (ocn?.approvalStage == stagesOfApproval.STAGE2) {
            const AO = ocn.approvalOfficers.filter((officer)=>officer.stageOfApproval == stagesOfApproval.STAGE2);
            //   }
            const checkOfficer = ocn.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
            if (checkOfficer.length == 0) {
              ocn.approvalOfficers.push({
                name: user.name,
                id: user._id,
                office: user.subrole,
                department: user.role,
                stageOfApproval: stagesOfApproval.STAGE3
              });
            }
            // @ts-ignore
            //   ocn.tracking.push(track);
            ocn.approvalStage = stagesOfApproval.STAGE1;
            ocn.nextApprovalOfficer = AO[0].id;
            //   ocn.comments.push({
            //     comment:data.comment,
            //     commentBy:user._id
            //   })
            await ocn.save();
            await createLog({
              user: user._id,
              activities: {
                title: 'OCN',
                // @ts-ignore
                activity: `You Rejected an Ocn approval request`,
                time: new Date().toISOString()
              }
            });
            const apUser = await this.user.findById(ocn.nextApprovalOfficer);
            await new Notify().push({
              subject: 'Outgoing cylinder note(OCN)',
              content: `An OCN you Approved has been rejected please check and make adiquate corrections. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
              user: apUser
            });
            return Promise.resolve(ocn);
          }
        } else {
          const hod = await this.user.findOne({branch: user.branch, subrole: 'head of department', role: user.role}).populate({
            path: 'branch', model: 'branches'
          });
          // console.log(hod);
          if (ocn?.approvalStage == stagesOfApproval.START) {
            const checkOfficer = ocn.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
            console.log(checkOfficer);
            if (checkOfficer.length == 0) {
              ocn.approvalOfficers.push({
                name: user.name,
                id: user._id,
                office: user.subrole,
                department: user.role,
                stageOfApproval: stagesOfApproval.STAGE1
              });
            }
            // @ts-ignore
            //   ocn.tracking.push(track)
            ocn.approvalStage = stagesOfApproval.STAGE1;
            // @ts-ignore
            ocn.nextApprovalOfficer = hod?._id;
            //   ocn.comments.push({
            //     comment:data.comment,
            //     commentBy:user._id
            //   })
            // console.log(ocn)
            await ocn.save();
            await createLog({
              user: user._id,
              activities: {
                title: 'OCN',
                // @ts-ignore
                activity: `You Approved an OCN approval request for ${ocn.customer.name}`,
                time: new Date().toISOString()
              }
            });
            const apUser = await this.user.findById(ocn.nextApprovalOfficer);
            await new Notify().push({
              subject: 'Outgoing cylinder note(OCN)',
              content: `An OCN has been initiatedand requires your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
              user: apUser
            });
            return Promise.resolve(ocn);
          } else if (ocn?.approvalStage == stagesOfApproval.STAGE1) {
            const checkOfficer = ocn.approvalOfficers.filter((officer)=>`${officer.id}` == `${user._id}`);
            if (checkOfficer.length == 0) {
              ocn.approvalOfficers.push({
                name: user.name,
                id: user._id,
                office: user.subrole,
                department: user.role,
                stageOfApproval: stagesOfApproval.STAGE2
              });
            }
            // @ts-ignore
            // ocn.tracking.push(track)
            ocn.approvalStage = stagesOfApproval.STAGE2;
            // console.log(hod)
            const branchAdmin = await this.user.findOne({branch: hod?.branch, subrole: 'superadmin'});
            // @ts-ignore
            ocn.nextApprovalOfficer = branchAdmin?._id;
            //   ocn.comments.push({
            //     comment:data.comment,
            //     commentBy:user._id
            //   })
            await ocn.save();
            await createLog({
              user: user._id,
              activities: {
                title: 'OCN',
                // @ts-ignore
                activity: `You Approved an OCN approval request for ${ocn.customer.name}`,
                time: new Date().toISOString()
              }
            });
            const apUser = await this.user.findById(ocn.nextApprovalOfficer);
            await new Notify().push({
              subject: 'Outgoing cylinder note(OCN)',
              content: `An OCN has been initiatedand requires your approval. check and make appropriate corrections approval click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
              user: apUser
            });
            return Promise.resolve(ocn);
          } else if (ocn?.approvalStage == stagesOfApproval.STAGE2) {
            const checkOfficer = ocn.approvalOfficers.filter((officer)=> `${officer.id}` == `${user._id}`);
            if (checkOfficer.length == 0) {
              ocn.approvalOfficers.push({
                name: user.name,
                id: user._id,
                office: user.subrole,
                department: user.role,
                stageOfApproval: stagesOfApproval.STAGE3
              });
            }
            // @ts-ignore
            //   transfer.tracking.push(track)
            ocn.approvalStage = stagesOfApproval.APPROVED;
            ocn.approvalStatus = TransferStatus.COMPLETED;
            // @ts-ignore
            // transfer.nextApprovalOfficer = data.nextApprovalOfficer
            //   transfer.comments.push(ocn);
            await ocn.save();
            await createLog({
              user: user._id,
              activities: {
                title: 'OCN',
                // @ts-ignore
                activity: `You Approved an OCN approval request for ${ocn.customer.name}`,
                time: new Date().toISOString()
              }
            });
            const apUser = await this.user.findOne({role: 'security', subrole: 'head of department', branch: ocn.branch});
            await new Notify().push({
              subject: 'Outgoing cylinder note (OCN)',
              content: `OCN approval complete. click to view ${Environment.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
              user: apUser
            });
            return Promise.resolve(ocn);
          }
        }
      } catch (e) {
        this.handleException(e);
      }
    }

    public async fetchOcnApprovals(query: QueryInterface, user: UserInterface): Promise<OutgoingCylinderInterface[]|undefined> {
      try {
        const ObjectId = mongoose.Types.ObjectId;
        const {search, page, limit} = query;
        const options = {
          page: page||1,
          limit: limit||1,
          populate: [
            {path: 'customer', model: 'customer'},
            {path: 'supplier', model: 'supplier'},
            {path: 'approvalOfficers', model: 'User'},
            {path: 'nextApprovalOfficer', model: 'User'},
            {path: 'branch', model: 'branches'},
            {path: 'cylinders', model: 'registered-cylinders'},
            {path: 'invoice', model: 'reciept'},
            {path: 'routePlan', model: 'pickup-routes'},
            {path: 'delivery_ids', model: 'waybill'}
          ]
        };
        let q = {
          branch: user.branch,
          nextApprovalOfficer: user._id,
          approvalStatus: TransferStatus.PENDING
        };
        const or = [];
        if (search) {
          or.push({cylinderType: new RegExp(search, 'gi')});
        }
        if (or.length > 0) {
          // @ts-ignore
          q = {...q, $or: or};
        }
        // @ts-ignore
        const outgoing = await this.ocn.paginate(q, options);
        return Promise.resolve(outgoing);
      } catch (e) {
        this.handleException(e);
      }
    }

    public async fetchOcns(query: QueryInterface, user: UserInterface): Promise<OutgoingCylinderInterface| undefined> {
      try {
        const ObjectId = mongoose.Types.ObjectId;
        const {search, filter, page, limit, noteType, type} = query;
        const options = {
          page: page||1,
          limit: limit||10,
          populate: [
            {path: 'customer', model: 'customer'},
            {path: 'supplier', model: 'supplier'},
            {path: 'approvalOfficers', model: 'User'},
            {path: 'nextApprovalOfficer', model: 'User'},
            {path: 'branch', model: 'branches'},
            {path: 'cylinders', model: 'registered-cylinders'},
            {path: 'invoice', model: 'reciept'},
            {path: 'routePlan', model: 'pickup-routes'},
            {path: 'delivery_ids', model: 'waybill'}
          ]
        };
        let q = {
          branch: user.branch,
        };
        const or = [];
        if (search) {
          or.push({cylinderType: new RegExp(search, 'gi')});
          or.push({approvalStatus: new RegExp(search, 'gi')});
          or.push({icnNo: new RegExp(search, 'gi')});
          or.push({ocnNo: new RegExp(search, 'gi')});
          or.push({noteType: new RegExp(search, 'gi')});
        }
        if (filter) {
          // @ts-ignore
          q = {...q, status: filter};
        }
        if (noteType) {
          // @ts-ignore
          q = {...q, noteType: noteType};
        }
        if (type) {
          // @ts-ignore
          q = {...q, type: type};
        }
        if (or.length > 0) {
          // @ts-ignore
          q = {...q, $or: or};
        }
        // @ts-ignore
        const outgoing = await this.ocn.paginate(q, options);
        return Promise.resolve(outgoing);
      } catch (e) {
        this.handleException(e);
      }
    }

    public async viewOcnDetails(ocnId: string): Promise<OutgoingCylinderInterface|undefined> {
      try {
        const outgoing = await this.ocn.findById(ocnId).populate([
          {path: 'customer', model: 'customer'},
          {path: 'supplier', model: 'supplier'},
          {path: 'approvalOfficers', model: 'User'},
          {path: 'nextApprovalOfficer', model: 'User'},
          {path: 'branch', model: 'branches'},
          {path: 'cylinders', model: 'registered-cylinders'},
          {path: 'invoice', model: 'reciept'},
          {path: 'routePlan', model: 'pickup-routes'},
          {path: 'delivery_ids', model: 'waybill'}
        ]);
        return Promise.resolve(outgoing as OutgoingCylinderInterface);
      } catch (e) {
        this.handleException(e);
      }
    }
}

export default OutGoingCylinder;

