/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable require-jsdoc */
import {
  Request,
  Response,
  RequestHandler
} from 'express';
import {BadInputFormatException} from '../../exceptions';
import Cylinder from '../../modules/cylinder';
import {formatDate} from '../../util/token';
import Ctrl from '../ctrl';
import Validator from './validator';


class CylinderController extends Ctrl {
  private module: Cylinder;

  constructor(module: Cylinder) {
    super(),
    this.module = module;
  }


  createCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const cylinder = await this.module.createCylinder(req.body, req.user);
        this.ok(res, 'Created', cylinder);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  cylinderStats(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.cylinderStats(req.user);
        this.ok(res, 'fetched stats', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCylinders(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        // @ts-ignore
        const list = await this.module.fetchCylinders(req.query);
        this.ok(res, 'fetched cylinder types', list);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  cylinderDetails(): RequestHandler {
    return async (req: Request, res: Response)=> {
      try {
        const {id} = req.params;
        const cylinder = await this.module.cylinderDetails(id);
        this.ok(res, 'Cylinder type', cylinder);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  registerCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.regCylinder(req.body, req.user);
        this.ok(res, 'Registered', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  updateRegCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {cylinderId} = req.params;
        // @ts-ignore
        const data = await this.module.updateRegCylinder({...req.body, cylinderId}, req.user);
        this.ok(res, 'updated registered cylinder', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchRegisteredCylinders(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchRegisteredCylinders(req.query, req.user);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchRegisteredCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {id} = req.params;
        // @ts-ignore
        const cylinder = await this.module.fetchRegisteredCylinder(id, req.user);
        this.ok(res, 'Fetched details', cylinder);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  transferCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const transfer = await this.module.transferCylinders(req.body, req.user);
        this.ok(res, transfer?.message, transfer?.transfer);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  approveTransfer(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const approval = await this.module.approveTransfer(req.body, req.user);
        this.ok(res, `${approval?.message}`, approval?.transfer);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchTransferRequests(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        // @ts-ignore
        const transfers = await this.module.fetchTransferRequets(req.query, req.user);
        this.ok(res, 'fetched', transfers);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchChangeGasRequests(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchChangeCylinderRequest(req.query, req.user);
        this.ok(res, 'change cylinder requests', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchTransferDetails(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.fetchTransferDetails(req.params.id);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  usersPendingApprovals(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchUserPendingApproval(req.query, req.user);
        this.ok(res, 'Pending approvals fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  deleteRegisteredCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const {cylinderId} = req.params;
        // @ts-ignore
        const data = await this.module.deleteRegisteredCylinder(cylinderId, req.user);
        this.ok(res, 'Deleted', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchFaultyCylinders(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchFaultyCylinders(req.query, req.user);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCustomerCylinders(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchCustomerCylinders(req.query, req.params.customerId);
        this.ok(res, 'fetched cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  cylinderReturned(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.cylinderReturned(req.params.cylinderId);
        this.ok(res, 'cylinder returned', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  downloadCylinderCsv(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.downloadCylinderCsv();
        res.header('Content-Type', 'text/csv');
        res.attachment(
          `${formatDate(new Date().toISOString())
            .split('/')
            .join('.')}.cylinders.csv`
        );
        console.log(data);
        res.send(data);
        // this.ok(res, 'downloaded', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  registerMultipleCylinders(): RequestHandler {
    return async (req: Request, res: Response) =>{
      try {
        if (!req.files) {
          throw new BadInputFormatException('file is required');
        }
        // @ts-ignore
        const data = await this.module.registerMultipleCylinders(req.files.file, req.user);
        this.ok(res, 'done', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCompletedTransfers(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchTransferReport(req.query, req.user);
        this.ok(res, 'transfer report fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  transferCylinderStats(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.cylinderTransferStats(req.user);
        this.ok(res, 'transfer stats', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  faultyCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.faultyCylinder(req.params.cylinderId, req.user);
        this.ok(res, 'cylinder marked as faulty', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  condemnCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.condemingCylinders(req.body, req.user);
        this.ok(res, 'Condemn cylinder process initiated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCondemnRequests(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchCondemnCylinderRequests(req.query, req.user);
        this.ok(res, 'condemn requests', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchPendingCondemnations(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
      // @ts-ignore
        const data = await this.module.fetchPendingCondemnRequests(req.query, req.user);
        this.ok(res, 'pending requests', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCondemnInfo(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.fetchCondemnationDetatils(req.params.condemnId);
        this.ok(res, 'condemnation details', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  approveCondemnCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.approveCondemnation({...req.body}, req.user);
        this.ok(res, 'done', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCondemnCylinders(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchArchivedCylinder(req.query, req.user);
        this.ok(res, 'archive fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  changeCylinderType(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.changeGasType(req.body, req.user);
        this.ok(res, 'gas change initiated', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchGasChangeRequests(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchChangeCylinderRequests(req.query, req.user);
        this.ok(res, 'change cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  changeCylinderDetails(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        const data = await this.module.fetchChangeCylinderDetails(req.params.cylinderId);
        this.ok(res, 'details', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchPendingChangeCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchPendingChangeRequest(req.query, req.user);
        this.ok(res, 'change cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  approveChangeCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.approveCylinderChange(req.body, req.user);
        this.ok(res, 'done', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fixFaultyCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fixedFaultyCylinder(req.params.cylinderId, req.user);
        this.ok(res, 'cylinder fixed', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  returnCylinder(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.returnCylinder({cylinders: req.body}, req.user);
        this.ok(res, data.message, data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchRegistredCylindersWP(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchRegisteredCylindersNoP(req.query, req.user);
        this.ok(res, 'registered cylinders', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }

  fetchCylinderWithScan(): RequestHandler {
    return async (req: Request, res: Response)=>{
      try {
        // @ts-ignore
        const data = await this.module.fetchCylinderWithScan(req.query, req.user);
        this.ok(res, 'fetched', data);
      } catch (e) {
        this.handleError(e, req, res);
      }
    };
  }
}

export {Validator};

export default CylinderController;
