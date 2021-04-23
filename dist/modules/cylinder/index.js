"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../../exceptions");
const cylinder_1 = require("../../models/cylinder");
const transferCylinder_1 = require("../../models/transferCylinder");
const module_1 = require("../module");
class Cylinder extends module_1.default {
    constructor(props) {
        super();
        this.cylinder = props.cylinder;
        this.registerCylinder = props.registerCylinder;
        this.transfer = props.transfer;
    }
    createCylinder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let exist = yield this.cylinder.findOne({ colorCode: data.colorCode });
                if (exist) {
                    throw new exceptions_1.BadInputFormatException('this color code is assigned to a gas type');
                }
                let payload = Object.assign(Object.assign({}, data), { creator: user._id });
                let newGas = yield this.cylinder.create(payload);
                return Promise.resolve(newGas);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCylinders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.cylinder.find(query);
                let bufferCylinders = cylinders.filter(cylinder => cylinder.type == cylinder_1.cylinderTypes.BUFFER);
                let assignedCylinders = cylinders.filter(cylinder => cylinder.type == cylinder_1.cylinderTypes.ASSIGNED);
                return Promise.resolve({
                    cylinders,
                    counts: {
                        totalCylinders: cylinders.length | 0,
                        totalBufferCylinders: bufferCylinders.length | 0,
                        totalAssignedCylinders: assignedCylinders.length | 0
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    cylinderDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.cylinder.findById(id);
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    regCylinder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(data)
            try {
                let manDate = new Date(data.dateManufactured);
                let payload = Object.assign(Object.assign({}, data), { dateManufactured: manDate.toISOString() });
                let newRegistration = yield this.registerCylinder.create(payload);
                return Promise.resolve(newRegistration);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchRegisteredCylinders(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const registeredCylinders = yield this.registerCylinder.find(query);
                return Promise.resolve(registeredCylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchRegisteredCylinder(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(id);
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    transferCylinders(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let transfer = new this.transfer(data);
                transfer.initiator = user._id,
                    transfer.transferStatus = transferCylinder_1.TransferStatus.PENDING;
                transfer.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1; //stage has been approved
                let track = {
                    title: "Initiate Transfer",
                    stage: transferCylinder_1.stagesOfApproval.STAGE1,
                    status: transferCylinder_1.ApprovalStatus.APPROVED,
                    dateApproved: new Date().toISOString(),
                    approvalOfficer: user._id,
                    nextApprovalOfficer: data.nextApprovalOfficer
                };
                //@ts-ignore
                transfer.tracking.push(track);
                transfer.approvalOfficers.push({
                    name: user.name,
                    id: user._id,
                    office: user.subrole,
                    department: user.role,
                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                });
                let com = {
                    comment: data.comment,
                    commentBy: user._id
                };
                //@ts-ignore
                transfer.comments.push(com);
                transfer.transferStatus = transferCylinder_1.TransferStatus.PENDING;
                yield transfer.save();
                return Promise.resolve(transfer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveTransfer(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // let decode = verify(data.token, signTokenKey);
                // let matchPWD = compareSync(data.password, user.password);
                // if(!matchPWD) {
                //   throw new BadInputFormatException('Incorrect password... please check the password');
                // }
                let transfer = yield this.transfer.findById(data.id);
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((transfer === null || transfer === void 0 ? void 0 : transfer.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = transfer.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = transfer.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            transfer.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        transfer.tracking.push(track);
                        transfer.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        transfer.nextApprovalOfficer = AO[0].id;
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield transfer.save();
                        return Promise.resolve({
                            message: "Rejected",
                            transfer
                        });
                    }
                    else if ((transfer === null || transfer === void 0 ? void 0 : transfer.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = transfer.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = transfer.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            transfer.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        transfer.tracking.push(track);
                        transfer.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        transfer.nextApprovalOfficer = AO[0].id;
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield transfer.save();
                        return Promise.resolve({
                            message: "Rejected",
                            transfer
                        });
                    }
                }
                else {
                    if ((transfer === null || transfer === void 0 ? void 0 : transfer.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        let checkOfficer = transfer.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            transfer.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        transfer.tracking.push(track);
                        transfer.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        transfer.nextApprovalOfficer = data.nextApprovalOfficer;
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield transfer.save();
                        return Promise.resolve({
                            message: "Approved",
                            transfer
                        });
                    }
                    else if ((transfer === null || transfer === void 0 ? void 0 : transfer.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let track = {
                            title: "Initiate Transfer",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        // console.log(track);
                        let checkOfficer = transfer.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            transfer.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        transfer.tracking.push(track);
                        transfer.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        transfer.nextApprovalOfficer = data.nextApprovalOfficer;
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield transfer.save();
                        return Promise.resolve({
                            message: "Approved",
                            transfer
                        });
                    }
                    else if ((transfer === null || transfer === void 0 ? void 0 : transfer.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "Initiate Transfer",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        let checkOfficer = transfer.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            transfer.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        transfer.tracking.push(track);
                        transfer.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        transfer.transferStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        transfer.nextApprovalOfficer = data.nextApprovalOfficer;
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield transfer.save();
                        return Promise.resolve({
                            message: "Approved",
                            transfer
                        });
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTransferRequets(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transfers = yield this.transfer.find(query);
                let totalApproved = transfers.filter(transfer => transfer.transferStatus == transferCylinder_1.TransferStatus.COMPLETED);
                let totalPending = transfers.filter(transfer => transfer.transferStatus == transferCylinder_1.TransferStatus.PENDING);
                return Promise.resolve({
                    transfer: transfers,
                    counts: {
                        totalApproved: totalApproved.length | 0,
                        totalPending: totalPending.length | 0,
                        totalTransfers: transfers.length | 0
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTransferDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transfer = yield this.transfer.findById(id);
                return Promise.resolve(transfer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchUserPendingApproval(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transfers = yield this.transfer.find(query);
                let pendingTransfers = transfers.filter(transfer => transfer.transferStatus == transferCylinder_1.TransferStatus.PENDING);
                let startStage = pendingTransfers.filter(transfer => {
                    if (transfer.approvalStage == transferCylinder_1.stagesOfApproval.START) {
                        for (let tofficer of transfer.approvalOfficers) {
                            if (`${tofficer.id}` == `${user._id}`) {
                                if (tofficer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1) {
                                    return transfer;
                                }
                            }
                            else if (`${transfer.nextApprovalOfficer}` == `${user._id}`) {
                                return transfer;
                            }
                        }
                    }
                });
                let stage1 = pendingTransfers.filter(transfer => {
                    if (transfer.approvalStage == transferCylinder_1.stagesOfApproval.STAGE1) {
                        for (let tofficer of transfer.approvalOfficers) {
                            if (`${tofficer.id}` == `${user._id}`) {
                                if (tofficer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2) {
                                    return transfer;
                                }
                            }
                            else if (`${transfer.nextApprovalOfficer}` == `${user._id}`) {
                                return transfer;
                            }
                        }
                    }
                });
                let stage2 = pendingTransfers.filter(transfer => {
                    if (transfer.approvalStage == transferCylinder_1.stagesOfApproval.STAGE2) {
                        for (let tofficer of transfer.approvalOfficers) {
                            if (`${tofficer.id}` == `${user._id}`) {
                                if (tofficer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE3) {
                                    return transfer;
                                }
                            }
                            else if (`${transfer.nextApprovalOfficer}` == `${user._id}`) {
                                return transfer;
                            }
                        }
                    }
                });
                let pendingApprovals;
                if (user.subrole == 'superadmin') {
                    pendingApprovals = stage2;
                }
                else if (user.subrole == 'head of department') {
                    pendingApprovals = stage1;
                }
                else {
                    pendingApprovals = startStage;
                }
                return Promise.resolve(pendingApprovals);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteRegisteredCylinder(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.cylinder.findById(id);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('This cylinder was not found');
                }
                yield cylinder.remove();
                return Promise.resolve({
                    message: 'Cylinder deleted'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Cylinder;
//# sourceMappingURL=index.js.map