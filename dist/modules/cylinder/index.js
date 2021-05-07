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
const bcryptjs_1 = require("bcryptjs");
const exceptions_1 = require("../../exceptions");
const cylinder_1 = require("../../models/cylinder");
const registeredCylinders_1 = require("../../models/registeredCylinders");
const transferCylinder_1 = require("../../models/transferCylinder");
const module_1 = require("../module");
class Cylinder extends module_1.default {
    constructor(props) {
        super();
        this.cylinder = props.cylinder;
        this.registerCylinder = props.registerCylinder;
        this.transfer = props.transfer;
        this.archive = props.archive;
        this.user = props.user;
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
                let foundCylinder;
                if (data.cylinderNumber) {
                    foundCylinder = yield this.registerCylinder.findOne({ cylinderNumber: data.cylinderNumber });
                }
                else if (data.assignedNumber) {
                    foundCylinder = yield this.registerCylinder.findOne({ assignedNumber: data.assignedNumber });
                }
                if (foundCylinder) {
                    throw new exceptions_1.BadInputFormatException('this cylinder has been registered');
                }
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
                const registeredCylinders = yield this.registerCylinder.find(query).populate([
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'branch', model: 'branches' }
                ]);
                const bufferCylinders = registeredCylinders.filter(cylinder => cylinder.cylinderType == cylinder_1.cylinderTypes.BUFFER);
                const assignedCylinders = registeredCylinders.filter(cylinder => cylinder.cylinderType == cylinder_1.cylinderTypes.ASSIGNED);
                return Promise.resolve({
                    cylinders: registeredCylinders,
                    counts: {
                        totalCylinders: registeredCylinders.length | 0,
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
    fetchRegisteredCylinder(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(id).populate([
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'branch', model: 'branches' }
                ]);
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchFaultyCylinders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.registerCylinder.find(query).populate([
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'branch', model: 'branches' }
                ]);
                const faulty = cylinders.filter(cylinder => cylinder.condition == cylinder_1.CylinderCondition.FAULTY);
                return Promise.resolve({
                    faulty
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    condemnCylinder(cylinderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(cylinderId);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('No cylinder found with this id');
                }
                const saveInfo = {
                    cylinderType: cylinder === null || cylinder === void 0 ? void 0 : cylinder.cylinderType,
                    condition: cylinder_1.CylinderCondition.DAMAGED,
                    waterCapacity: cylinder === null || cylinder === void 0 ? void 0 : cylinder.waterCapacity,
                    dateManufactured: cylinder === null || cylinder === void 0 ? void 0 : cylinder.dateManufactured,
                    assignedTo: cylinder === null || cylinder === void 0 ? void 0 : cylinder.assignedTo,
                    gasType: cylinder === null || cylinder === void 0 ? void 0 : cylinder.gasType,
                    standardColor: cylinder === null || cylinder === void 0 ? void 0 : cylinder.standardColor,
                    testingPresure: cylinder === null || cylinder === void 0 ? void 0 : cylinder.testingPresure,
                    fillingPreasure: cylinder === null || cylinder === void 0 ? void 0 : cylinder.fillingPreasure,
                    gasVolumeContent: cylinder === null || cylinder === void 0 ? void 0 : cylinder.gasVolumeContent,
                    cylinderNumber: cylinder === null || cylinder === void 0 ? void 0 : cylinder.cylinderNumber
                };
                const archive = yield this.archive.create(saveInfo);
                yield (cylinder === null || cylinder === void 0 ? void 0 : cylinder.remove());
                return Promise.resolve(archive);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchArchivedCylinder(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.archive.find(query).populate([
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'branch', model: 'branches' }
                ]);
                return Promise.resolve(cylinders);
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
                transfer.initiator = user._id;
                transfer.transferStatus = transferCylinder_1.TransferStatus.PENDING;
                transfer.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1; //stage has been approved
                let hod = yield this.user.findOne({ role: user.role, subrole: 'head of department', branch: user.branch });
                transfer.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                let track = {
                    title: "Initiate Transfer",
                    stage: transferCylinder_1.stagesOfApproval.STAGE1,
                    status: transferCylinder_1.ApprovalStatus.APPROVED,
                    dateApproved: new Date().toISOString(),
                    approvalOfficer: user._id,
                    nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
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
                let matchPWD = bcryptjs_1.compareSync(data.password, user.password);
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
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
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((transfer === null || transfer === void 0 ? void 0 : transfer.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
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
                        transfer.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
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
                            //@ts-ignore
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin
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
                        transfer.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
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
                        // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        let cylinders = transfer.cylinders;
                        if (transfer.type == transferCylinder_1.TransferType.TEMPORARY || transfer.type == transferCylinder_1.TransferType.PERMANENT) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.assignedTo = transfer.to;
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.cylinderType = registeredCylinders_1.TypesOfCylinders.ASSIGNED;
                                if (transfer.type == transferCylinder_1.TransferType.TEMPORARY) {
                                    //@ts-ignore
                                    cyl === null || cyl === void 0 ? void 0 : cyl.holdingTime = transfer.holdingTime;
                                }
                                yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                            }
                        }
                        else if (transfer.type == transferCylinder_1.TransferType.DIVISION) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                // cyl?.cylinderType = TypesOfCylinders.BUFFER;
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.department = transfer.toDepartment;
                                yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                            }
                        }
                        else if (transfer.type == transferCylinder_1.TransferType.REPAIR) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.department = transfer.toDEPARTMENT;
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.condition = transferCylinder_1.TransferType.REPAIR;
                                yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                            }
                        }
                        else if (transfer.type == transferCylinder_1.TransferType.BRANCH) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.branch = transfer.toBranch;
                                yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                            }
                        }
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
    faultyCylinder(cylinderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(cylinderId);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('cylinder not found');
                }
                //@ts-ignore
                cylinder.condition = cylinder_1.CylinderCondition.FAULTY;
                yield (cylinder === null || cylinder === void 0 ? void 0 : cylinder.save());
                return Promise.resolve(cylinder);
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
    fetchCustomerCylinders(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const cylinders = yield this.registerCylinder.find({ assignedTo: customerId });
                return Promise.resolve(cylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTransferReport(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transfers = yield this.transfer.find(query);
                const completed = transfers.filter(transfer => transfer.transferStatus == `${transferCylinder_1.TransferStatus.COMPLETED}`);
                return Promise.resolve(completed);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Cylinder;
//# sourceMappingURL=index.js.map