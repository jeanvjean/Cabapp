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
exports.mongoose = void 0;
const exceptions_1 = require("../../exceptions");
const cylinder_1 = require("../../models/cylinder");
const registeredCylinders_1 = require("../../models/registeredCylinders");
const transferCylinder_1 = require("../../models/transferCylinder");
const module_1 = require("../module");
const mail_1 = require("../../util/mail");
const static_1 = require("../../configs/static");
const logs_1 = require("../../util/logs");
const walk_in_customers_1 = require("../../models/walk-in-customers");
const supplier_1 = require("../../models/supplier");
const mongoose = require("mongoose");
exports.mongoose = mongoose;
class Cylinder extends module_1.default {
    constructor(props) {
        super();
        this.cylinder = props.cylinder;
        this.registerCylinder = props.registerCylinder;
        this.transfer = props.transfer;
        this.archive = props.archive;
        this.user = props.user;
        this.condemn = props.condemn;
        this.change_gas = props.change_gas;
        this.customer = props.customer;
        this.branch = props.branch;
        this.supplier = props.supplier;
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
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Cylinder type',
                        //@ts-ignore
                        activity: `You added a new cylinder type`,
                        time: new Date().toISOString()
                    }
                });
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
                //@ts-ignore
                const cylinders = yield this.cylinder.find({}, Object.assign({}, query));
                // let bufferCylinders = cylinders.docs.filter(cylinder=> cylinder.type == cylinderTypes.BUFFER);
                // let assignedCylinders = cylinders.docs.filter(cylinder=> cylinder.type == cylinderTypes.ASSIGNED);
                return Promise.resolve({
                    cylinders
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
                // let checkReg = await this.registerCylinder.find({branch:user.branch}).sort({cylNo:-1}).limit(1);
                // let initNum;
                // if(checkReg[0] == undefined) {
                //   initNum = 1
                // }else {
                //   initNum = checkReg[0].cylNo+1;
                // }
                // const num = padLeft(initNum, 6, "");
                // let asnl = "ASNL";
                // let cyl = "CYL";
                // data.cylinderNumber = cyl+num;
                // data.assignedNumber = asnl+num
                let payload = Object.assign(Object.assign({}, data), { dateManufactured: manDate.toISOString(), branch: user.branch });
                let newRegistration = yield this.registerCylinder.create(payload);
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Register Cylinder',
                        //@ts-ignore
                        activity: `You registered a new ${newRegistration.cylinderType} cylinder`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(newRegistration);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateRegCylinder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(data.cylinderId);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('cylinder not found');
                }
                let updatedCyliner = yield this.registerCylinder.findByIdAndUpdate(cylinder._id, {
                    $set: data
                }, { new: true });
                return Promise.resolve(updatedCyliner);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    changeGasType(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const change = new this.change_gas(Object.assign(Object.assign({}, data), { branch: user.branch, initiator: user._id }));
                let hod = yield this.user.findOne({ role: user.role, subrole: 'head of department', branch: user.branch });
                change.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                let track = {
                    title: "Condemn cylinders",
                    stage: transferCylinder_1.stagesOfApproval.STAGE1,
                    status: transferCylinder_1.ApprovalStatus.APPROVED,
                    dateApproved: new Date().toISOString(),
                    approvalOfficer: user._id,
                    nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
                };
                //@ts-ignore
                change.tracking.push(track);
                change.approvalOfficers.push({
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
                change.comments.push(com);
                yield change.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Cylinder Change',
                        activity: `You started a new cylinder Change process`,
                        time: new Date().toISOString()
                    }
                });
                yield new mail_1.default().push({
                    subject: "New cylinder condemation approval",
                    content: `A cylinder type change has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
                    user: hod
                });
                return Promise.resolve(change);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveCylinderChange(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                let change = yield this.change_gas.findById(data.changeId).populate([
                    { path: 'initiator', model: 'User' }
                ]);
                if (!change) {
                    throw new exceptions_1.BadInputFormatException('cylinder change request not found');
                }
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((change === null || change === void 0 ? void 0 : change.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = change.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = change.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            change.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        change.tracking.push(track);
                        change.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        change.nextApprovalOfficer = AO[0].id;
                        change.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield change.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Change',
                                //@ts-ignore
                                activity: `You Rejected a Cylinder Change request from ${change.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(change.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Change",
                            content: `A Cylinder Change you initiated has been rejected, check it and try again. click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
                            user: apUser
                        });
                        return Promise.resolve(change);
                    }
                    else if ((change === null || change === void 0 ? void 0 : change.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = change.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = change.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            change.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        change.tracking.push(track);
                        change.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        change.nextApprovalOfficer = AO[0].id;
                        change.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield change.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Change',
                                //@ts-ignore
                                activity: `You Rejected a Cylinder Change request from ${change.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(change.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Change",
                            content: `A Cylinder Change you approved has been rejected. check and try again. click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
                            user: apUser
                        });
                        return Promise.resolve(change);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((change === null || change === void 0 ? void 0 : change.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
                        };
                        let checkOfficer = change.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            change.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        change.tracking.push(track);
                        change.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        change.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        change.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield change.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Change',
                                //@ts-ignore
                                activity: `You Approved a Cylinder Change request from ${change.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(change.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Change",
                            content: `A Cylinder Change has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
                            user: apUser
                        });
                        return Promise.resolve(change);
                    }
                    else if ((change === null || change === void 0 ? void 0 : change.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
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
                        let checkOfficer = change.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            change.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        change.tracking.push(track);
                        change.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        change.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
                        change.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield change.save();
                        // console.log(transfer)
                        // let logMan = condem.initiator;
                        // console.log(logMan);
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Change',
                                //@ts-ignore
                                activity: `You Approved a Cylinder Change request from ${change.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(change.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Change",
                            content: `A Cylinder Change has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
                            user: apUser
                        });
                        return Promise.resolve(change);
                    }
                    else if ((change === null || change === void 0 ? void 0 : change.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "Initiate Transfer",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                        };
                        let checkOfficer = change.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            change.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        change.tracking.push(track);
                        change.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        change.approvalStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        // change.nextApprovalOfficer = data.nextApprovalOfficer
                        change.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Change',
                                //@ts-ignore
                                activity: `You Approved a Cylinder Change request from ${change.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(change.initiator);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Change",
                            content: `A Cylinder Change you initiated has been approved to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${change._id}`,
                            user: apUser
                        });
                        let cylinders = change.cylinders;
                        for (let cyl of cylinders) {
                            let changeCyl = yield this.registerCylinder.findById(cyl);
                            //@ts-ignore
                            changeCyl === null || changeCyl === void 0 ? void 0 : changeCyl.gasType = change.gasType;
                            //@ts-ignore
                            changeCyl === null || changeCyl === void 0 ? void 0 : changeCyl.cylinderType = change.cylinderType;
                            if ((changeCyl === null || changeCyl === void 0 ? void 0 : changeCyl.cylinderType) == registeredCylinders_1.TypesOfCylinders.ASSIGNED) {
                                changeCyl.assignedTo = change.assignedTo;
                            }
                            yield (changeCyl === null || changeCyl === void 0 ? void 0 : changeCyl.save());
                        }
                        yield change.save();
                        return Promise.resolve(change);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchChangeCylinderRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'gasType', model: 'cylinder' },
                        { path: 'assignedTo', miodel: 'customer' }
                    ] });
                let changes;
                if (search === null || search === void 0 ? void 0 : search.length) {
                    //@ts-ignore
                    changes = yield this.change_gas.paginate({ branch: user.branch, $or: [{ approvalStatus: search }] }, options);
                }
                else {
                    //@ts-ignore
                    changes = yield this.change_gas.paginate({ branch: user.branch }, options);
                }
                // console.log(changes)
                return changes;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPendingChangeRequest(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'gasType', model: 'cylinder' },
                        { path: 'assignedTo', miodel: 'customer' }
                    ] });
                //@ts-ignore
                const change_requests = yield this.change_gas.paginate({
                    branch: user.branch,
                    approvaStatus: transferCylinder_1.TransferStatus.PENDING,
                    nextApprovalOfficer: user._id
                }, options);
                return change_requests;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchChangeCylinderDetails(cylinderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.change_gas.findById(cylinderId).populate([
                    { path: 'cylinders', model: 'registered-cylinders' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'initiator', model: 'User' },
                    { path: 'gasType', model: 'cylinder' },
                    { path: 'branch', model: 'branches' },
                    { path: 'assignedTo', model: 'customer' }
                ]);
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchRegisteredCylinders(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, holder, cylinderType, gasType, customer, supplier } = query;
                const ObjectId = mongoose.Types.ObjectId;
                let options = Object.assign(Object.assign({}, query), { populate: [
                        'assignedTo',
                        'branch',
                        'gasType',
                        'supplier',
                        "fromBranch"
                    ] });
                let aggregate;
                const aggregate1 = this.registerCylinder.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { condition: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { holder: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'gasType.gasName': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'supplier.supplierType': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    },
                ]);
                const aggregate2 = this.registerCylinder.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { condition: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { holder: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'gasType.gasName': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'supplier.supplierType': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) },
                                { holder: holder === null || holder === void 0 ? void 0 : holder.toLowerCase() }
                            ]
                        }
                    }
                ]);
                const aggregate3 = this.registerCylinder.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { condition: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { holder: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'gasType.gasName': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'supplier.supplierType': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) },
                                { holder: holder === null || holder === void 0 ? void 0 : holder.toLowerCase() },
                                { gasType: gasType === null || gasType === void 0 ? void 0 : gasType.toLowerCase() }
                            ]
                        }
                    }
                ]);
                const aggregate4 = this.registerCylinder.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { condition: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { holder: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'gasType.gasName': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'supplier.supplierType': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) },
                                { holder: holder === null || holder === void 0 ? void 0 : holder.toLowerCase() },
                                { gasType: gasType === null || gasType === void 0 ? void 0 : gasType.toLowerCase() },
                                { cylinderType: cylinderType === null || cylinderType === void 0 ? void 0 : cylinderType.toLowerCase() }
                            ]
                        }
                    }
                ]);
                const aggregate5 = this.registerCylinder.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { condition: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { holder: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'gasType.gasName': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'supplier.supplierType': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) },
                                { holder: holder === null || holder === void 0 ? void 0 : holder.toLowerCase() },
                                { gasType: gasType === null || gasType === void 0 ? void 0 : gasType.toLowerCase() },
                                { cylinderType: cylinderType === null || cylinderType === void 0 ? void 0 : cylinderType.toLowerCase() },
                                { 'assignedTo.name': customer === null || customer === void 0 ? void 0 : customer.toLowerCase() }
                            ]
                        }
                    }
                ]);
                const aggregate6 = this.registerCylinder.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { condition: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { holder: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { assignedNumber: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'gasType.gasName': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderType: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { 'supplier.supplierType': {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }, { cylinderStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) },
                                { gasType: gasType === null || gasType === void 0 ? void 0 : gasType.toLowerCase() },
                                { cylinderType: cylinderType === null || cylinderType === void 0 ? void 0 : cylinderType.toLowerCase() },
                                { 'assignedTo.name': customer === null || customer === void 0 ? void 0 : customer.toLowerCase() },
                                { 'supplier.supplierType': supplier === null || supplier === void 0 ? void 0 : supplier.toLowerCase() }
                            ]
                        }
                    }
                ]);
                if ((holder === null || holder === void 0 ? void 0 : holder.length) && (cylinderType === null || cylinderType === void 0 ? void 0 : cylinderType.length) && (gasType === null || gasType === void 0 ? void 0 : gasType.length) && (customer === null || customer === void 0 ? void 0 : customer.length) && (supplier === null || supplier === void 0 ? void 0 : supplier.length)) {
                    aggregate = aggregate6;
                }
                else if ((holder === null || holder === void 0 ? void 0 : holder.length) && (cylinderType === null || cylinderType === void 0 ? void 0 : cylinderType.length) && (gasType === null || gasType === void 0 ? void 0 : gasType.length) && (customer === null || customer === void 0 ? void 0 : customer.length)) {
                    aggregate = aggregate5;
                }
                else if ((holder === null || holder === void 0 ? void 0 : holder.length) && (cylinderType === null || cylinderType === void 0 ? void 0 : cylinderType.length) && (gasType === null || gasType === void 0 ? void 0 : gasType.length)) {
                    aggregate = aggregate4;
                }
                else if ((holder === null || holder === void 0 ? void 0 : holder.length) && (gasType === null || gasType === void 0 ? void 0 : gasType.length)) {
                    aggregate = aggregate3;
                }
                else if (holder === null || holder === void 0 ? void 0 : holder.length) {
                    aggregate = aggregate2;
                }
                else {
                    aggregate = aggregate1;
                }
                // let gas = await this.cylinder.findById()
                //@ts-ignore
                var registeredCylinders = yield this.registerCylinder.aggregatePaginate(aggregate, options);
                // await this.cylinder.populate(registeredCylinders, {path: "gasType"});
                for (let cyl of registeredCylinders.docs) {
                    let gas = yield this.cylinder.findOne({ _id: cyl.gasType });
                    cyl.gasType = gas;
                    let customer = yield this.customer.findById(cyl.assignedTo);
                    cyl.assignedTo = customer;
                    let supplier = yield this.supplier.findById(cyl.supplier);
                    cyl.supplier = supplier;
                    let branch = yield this.branch.findById(cyl.supplier);
                    cyl.branch = branch;
                    let fromBranch = yield this.branch.findById(cyl.supplier);
                    cyl.fromBranch = fromBranch;
                }
                //@ts-ignore
                const cylinders = yield this.registerCylinder.find({ branch: user.branch });
                const bufferCylinders = cylinders.filter(cylinder => cylinder.cylinderType == cylinder_1.cylinderTypes.BUFFER);
                //@ts-ignore
                const assignedCylinders = cylinders.filter(cylinder => cylinder.cylinderType == cylinder_1.cylinderTypes.ASSIGNED);
                return Promise.resolve({
                    cylinders: registeredCylinders,
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
            ;
        });
    }
    fetchRegisteredCylindersNoP(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = Object.assign({}, query);
                const cylinders = yield this.registerCylinder.find({ branch: user.branch }).populate([
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'branch', model: 'branches' },
                    { path: 'gasType', model: 'cylinder' },
                    { path: 'supplier', model: 'supplier' }
                ]);
                return Promise.resolve(cylinders);
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
                    { path: 'branch', model: 'branches' },
                    { path: 'gasType', model: 'cylinder' },
                    { path: 'toBranch', model: 'branches' }
                ]);
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    cylinderStats(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.registerCylinder.find({ branch: user.branch }).populate([
                    { path: 'supplier', model: 'supplier' }
                ]);
                const bufferCylinder = cylinders.filter(cylinder => cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER).length;
                const assignedCylinder = cylinders.filter(cylinder => cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED).length;
                const withCustomer = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER).length;
                const withAsnl = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL).length;
                const customerBufferCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER).length;
                const customerAssignedCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED).length;
                const asnlBufferCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER).length;
                const asnlAssignedCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED).length;
                const asnlFilledCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED).length;
                const asnlEmptyCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.EMPTY).length;
                const filledBufferCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER).length;
                const filledAssignedCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED).length;
                const emptyBufferCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER).length;
                const emptyAssignedCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED).length;
                const faultyFilledCustomerCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED && cylinder.condition == cylinder_1.CylinderCondition.FAULTY).length;
                const faultyEmptyCustomerCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.EMPTY && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED && cylinder.condition == cylinder_1.CylinderCondition.FAULTY).length;
                const goodFilledCustomerCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.FILLED && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED && cylinder.condition == cylinder_1.CylinderCondition.GOOD).length;
                const goodEmptyCustomerCylinders = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.CUSTOMER && cylinder.cylinderStatus == walk_in_customers_1.WalkinCustomerStatus.EMPTY && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED && cylinder.condition == cylinder_1.CylinderCondition.GOOD).length;
                const asnlTotalGoodBuffer = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER && cylinder.condition == cylinder_1.CylinderCondition.GOOD).length;
                const asnlTotalBadBuffer = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.BUFFER && cylinder.condition == cylinder_1.CylinderCondition.FAULTY).length;
                const asnlTotalGoodAssigned = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED && cylinder.condition == cylinder_1.CylinderCondition.GOOD).length;
                const asnlTotalBadAssigned = cylinders.filter(cylinder => cylinder.holder == registeredCylinders_1.cylinderHolder.ASNL && cylinder.cylinderType == registeredCylinders_1.TypesOfCylinders.ASSIGNED && cylinder.condition == cylinder_1.CylinderCondition.FAULTY).length;
                const externalSupplier = cylinders.filter(cylinder => 
                //@ts-ignore
                cylinder.holder == registeredCylinders_1.cylinderHolder.SUPPLIER && cylinder.supplier.supplierType == supplier_1.SupplierTypes.EXTERNAL).length;
                const internalSupplier = cylinders.filter(cylinder => 
                //@ts-ignore
                cylinder.holder == registeredCylinders_1.cylinderHolder.SUPPLIER && cylinder.supplier.supplierType == supplier_1.SupplierTypes.INTERNAL).length;
                return Promise.resolve({
                    bufferCylinder,
                    assignedCylinder,
                    filledAssignedCylinders,
                    customerBufferCylinders,
                    emptyAssignedCylinders,
                    customerAssignedCylinders,
                    filledBufferCylinders,
                    emptyBufferCylinders,
                    customer: {
                        totalCylinders: withCustomer,
                        totalFilled: faultyFilledCustomerCylinders + goodFilledCustomerCylinders,
                        totalEmpty: faultyEmptyCustomerCylinders + goodEmptyCustomerCylinders,
                        faultyFilledCustomerCylinders,
                        faultyEmptyCustomerCylinders,
                        goodFilledCustomerCylinders,
                        goodEmptyCustomerCylinders
                    },
                    asnl: {
                        totalCylinders: withAsnl,
                        buffer: asnlBufferCylinders,
                        assigned: asnlAssignedCylinders,
                        totalFilled: asnlFilledCylinders,
                        totalEmpty: asnlEmptyCylinders,
                        asnlTotalGoodBuffer,
                        asnlTotalBadBuffer,
                        asnlTotalGoodAssigned,
                        asnlTotalBadAssigned
                    },
                    supplier: {
                        total: internalSupplier + externalSupplier,
                        internalSupplier,
                        externalSupplier
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    cylinderTransferStats(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.transfer.find({ branch: user.branch });
                //@ts-ignore
                const approvedTransfers = cylinders.filter(cylinder => cylinder.approvalStatus == transferCylinder_1.TransferStatus.COMPLETED).length;
                //@ts-ignore
                const pendingTransfers = cylinders.filter(cylinder => cylinder.approvalStatus == transferCylinder_1.TransferStatus.PENDING).length;
                return Promise.resolve({
                    all_transfers: cylinders.length | 0,
                    approvedTransfers: approvedTransfers | 0,
                    pendingTransfers: pendingTransfers | 0
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchFaultyCylinders(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                let options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'assignedTo', model: 'customer' },
                        { path: 'branch', model: 'branches' },
                        { path: 'gasType', model: 'cylinder' },
                    ] });
                let cylinders;
                if (search === null || search === void 0 ? void 0 : search.length) {
                    //@ts-ignore
                    cylinders = yield this.registerCylinder.paginate({
                        branch: user.branch,
                        condition: cylinder_1.CylinderCondition.FAULTY,
                        $or: [{ cylinderType: search }]
                    }, options);
                }
                else {
                    //@ts-ignore
                    cylinders = yield this.registerCylinder.paginate({
                        branch: user.branch,
                        condition: cylinder_1.CylinderCondition.FAULTY
                    }, options);
                }
                return Promise.resolve(cylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    condemnCylinder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let skipped = [];
                for (let cyl of data.cylinders) {
                    const cylinder = yield this.registerCylinder.findById(cyl);
                    if (!cylinder) {
                        skipped.push(cyl);
                    }
                    const saveInfo = {
                        cylinderType: cylinder === null || cylinder === void 0 ? void 0 : cylinder.cylinderType,
                        condition: cylinder_1.CylinderCondition.DAMAGED,
                        waterCapacity: cylinder === null || cylinder === void 0 ? void 0 : cylinder.waterCapacity,
                        dateManufactured: cylinder === null || cylinder === void 0 ? void 0 : cylinder.dateManufactured,
                        assignedTo: cylinder === null || cylinder === void 0 ? void 0 : cylinder.assignedTo,
                        gasType: cylinder === null || cylinder === void 0 ? void 0 : cylinder.gasType,
                        purchaseCost: cylinder === null || cylinder === void 0 ? void 0 : cylinder.purchaseCost,
                        standardColor: cylinder === null || cylinder === void 0 ? void 0 : cylinder.standardColor,
                        testingPresure: cylinder === null || cylinder === void 0 ? void 0 : cylinder.testingPresure,
                        fillingPreasure: cylinder === null || cylinder === void 0 ? void 0 : cylinder.fillingPreasure,
                        gasVolumeContent: cylinder === null || cylinder === void 0 ? void 0 : cylinder.gasVolumeContent,
                        cylinderNumber: cylinder === null || cylinder === void 0 ? void 0 : cylinder.cylinderNumber,
                        assignedNumber: cylinder === null || cylinder === void 0 ? void 0 : cylinder.assignedNumber,
                        branch: cylinder === null || cylinder === void 0 ? void 0 : cylinder.branch
                    };
                    yield this.archive.create(saveInfo);
                    yield (cylinder === null || cylinder === void 0 ? void 0 : cylinder.remove());
                }
                return Promise.resolve({
                    message: 'archived cylinders',
                    skipped
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    condemingCylinders(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const condemn = new this.condemn(Object.assign(Object.assign({}, data), { branch: user.branch, initiator: user._id }));
                let hod = yield this.user.findOne({ role: user.role, subrole: 'head of department', branch: user.branch });
                condemn.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                let track = {
                    title: "Condemn cylinders",
                    stage: transferCylinder_1.stagesOfApproval.STAGE1,
                    status: transferCylinder_1.ApprovalStatus.APPROVED,
                    dateApproved: new Date().toISOString(),
                    approvalOfficer: user._id,
                    nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
                };
                //@ts-ignore
                condemn.tracking.push(track);
                condemn.approvalOfficers.push({
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
                condemn.comments.push(com);
                yield condemn.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Cylinder Condemn',
                        activity: `You started a new cylinder condemn process`,
                        time: new Date().toISOString()
                    }
                });
                yield new mail_1.default().push({
                    subject: "New cylinder condemation approval",
                    content: `A cylinder condemnation has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${condemn._id}`,
                    user: hod
                });
                return Promise.resolve(condemn);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveCondemnation(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                let condem = yield this.condemn.findById(data.condemnId).populate([
                    { path: 'initiator', model: 'User' }
                ]);
                if (!condem) {
                    throw new exceptions_1.BadInputFormatException('cylinder condemn request not found');
                }
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((condem === null || condem === void 0 ? void 0 : condem.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = condem.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = condem.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            condem.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        condem.tracking.push(track);
                        condem.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        condem.nextApprovalOfficer = AO[0].id;
                        condem.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield condem.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Condemnnation',
                                //@ts-ignore
                                activity: `You Rejected a Cylinder Condemnnation request from ${condem.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(condem.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Condemnnation",
                            content: `A Cylinder Condemnnation you initiated has been rejected, check it and try again. click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
                            user: apUser
                        });
                        return Promise.resolve(condem);
                    }
                    else if ((condem === null || condem === void 0 ? void 0 : condem.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = condem.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = condem.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            condem.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        condem.tracking.push(track);
                        condem.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        condem.nextApprovalOfficer = AO[0].id;
                        condem.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield condem.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Condemnnation',
                                //@ts-ignore
                                activity: `You Rejected a Cylinder Condemnnation request from ${condem.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(condem.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Condemnnation",
                            content: `A Cylinder Condemnnation you approved has been rejected. check and try again. click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
                            user: apUser
                        });
                        return Promise.resolve(condem);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((condem === null || condem === void 0 ? void 0 : condem.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
                        };
                        let checkOfficer = condem.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            condem.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        condem.tracking.push(track);
                        condem.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        condem.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        condem.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield condem.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Condemnnation',
                                //@ts-ignore
                                activity: `You Approved a Cylinder Condemnnation request from ${condem.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(condem.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Condemnnation",
                            content: `A Cylinder Condemnnation has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
                            user: apUser
                        });
                        return Promise.resolve(condem);
                    }
                    else if ((condem === null || condem === void 0 ? void 0 : condem.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        // console.log(condem)
                        let track = {
                            title: "Condemn cylinder",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            //@ts-ignore
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin
                        };
                        // console.log(track);
                        let checkOfficer = condem.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            condem.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        condem.tracking.push(track);
                        condem.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        condem.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
                        condem.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield condem.save();
                        // console.log(transfer)
                        // let logMan = condem.initiator;
                        // console.log(logMan);
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Condemnnation',
                                //@ts-ignore
                                activity: `You Approved a Cylinder Condemnnation request from ${condem.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(condem.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New Cylinder Condemnnation",
                            content: `A Cylinder Condemnnation has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
                            user: apUser
                        });
                        return Promise.resolve(condem);
                    }
                    else if ((condem === null || condem === void 0 ? void 0 : condem.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "condemn cylinder",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                        };
                        let checkOfficer = condem.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            condem.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        // console.log(track)
                        //@ts-ignore
                        condem.tracking.push(track);
                        // console.log(condem)
                        condem.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        condem.approvalStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        // condem.nextApprovalOfficer = data.nextApprovalOfficer
                        condem.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Condemnnation',
                                //@ts-ignore
                                activity: `You Approved a Cylinder Condemnnation request from ${condem.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(condem.initiator);
                        yield new mail_1.default().push({
                            subject: "Cylinder Condemnation",
                            content: `A Cylinder Condemnnation you initiated has been approved to view ${static_1.default.FRONTEND_URL}/fetch-condemn-details/${condem._id}`,
                            user: apUser
                        });
                        let cylinders = condem.cylinders;
                        yield this.condemnCylinder({ cylinders });
                        yield condem.save();
                        return Promise.resolve(condem);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCondemnCylinderRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' }
                    ] });
                let requests;
                if (!(search === null || search === void 0 ? void 0 : search.length)) {
                    //@ts-ignore
                    requests = yield this.condemn.paginate({ branch: user.branch, $or: [{ approvalStatus: search }] }, options);
                }
                else {
                    //@ts-ignore
                    requests = yield this.condemn.paginate({ branch: user.branch }, Object.assign({}, query));
                }
                return requests;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPendingCondemnRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' }
                    ] });
                //@ts-ignore
                const requests = yield this.condemn.paginate({
                    branch: user.branch,
                    approvaStatus: transferCylinder_1.TransferStatus.PENDING,
                    nextApprovalOfficer: user._id
                }, options);
                return requests;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCondemnationDetatils(condemnId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const request = yield this.condemn.findById(condemnId).populate([
                    { path: 'cylinders', model: 'registered-cylinders' },
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'branch', model: 'branches' }
                ]);
                return Promise.resolve(request);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchArchivedCylinder(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                let options = Object.assign(Object.assign({}, query), { options: [
                        { path: 'assignedTo', model: 'customer' },
                        { path: 'branch', model: 'branches' }
                    ] });
                let cylinders;
                if (!(search === null || search === void 0 ? void 0 : search.length)) {
                    //@ts-ignore
                    cylinders = yield this.archive.paginate({
                        branch: user.branch,
                        $or: [{ assignedNumber: search === null || search === void 0 ? void 0 : search.toLowerCase() },
                            { cylinderNumber: search === null || search === void 0 ? void 0 : search.toLowerCase() },
                            { cylinderType: search === null || search === void 0 ? void 0 : search.toLowerCase() }
                        ]
                    }, options);
                }
                else {
                    //@ts-ignore
                    cylinders = yield this.archive.paginate({ branch: user.branch }, options);
                }
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
                const date = new Date();
                if (data.holdingTime) {
                    date.setDate(date.getDate() + data.holdingTime);
                    //@ts-ignore
                    data === null || data === void 0 ? void 0 : data.holdingTime = date.toISOString();
                }
                let transfer = new this.transfer(Object.assign(Object.assign({}, data), { branch: user.branch }));
                transfer.initiator = user._id;
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
                yield transfer.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Cylinder transfer',
                        //@ts-ignore
                        activity: `You started a new cylinder transfer process`,
                        time: new Date().toISOString()
                    }
                });
                yield new mail_1.default().push({
                    subject: "New cylinder transfer",
                    content: `A cylinder transfer has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
                    user: hod
                });
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
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                let transfer = yield this.transfer.findById(data.id).populate([
                    { path: 'initiator', model: 'User' }
                ]);
                if (!transfer) {
                    throw new exceptions_1.BadInputFormatException('cylinder transfer not found');
                }
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
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Transfer',
                                //@ts-ignore
                                activity: `You Rejected a cylinder transfer request from ${transfer.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(transfer.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New cylinder transfer",
                            content: `A cylinder transfer you initiated has been rejected, check it and try again. click to view ${static_1.default.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
                            user: apUser
                        });
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
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Transfer',
                                //@ts-ignore
                                activity: `You Rejected a cylinder transfer request from ${transfer.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(transfer.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New cylinder transfer",
                            content: `A cylinder transfer you approved has been rejected. check and try again. click to view ${static_1.default.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
                            user: apUser
                        });
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
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Transfer',
                                //@ts-ignore
                                activity: `You Approved a cylinder transfer request from ${transfer.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(transfer.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New cylinder transfer",
                            content: `A cylinder transfer has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
                            user: apUser
                        });
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
                        // console.log(transfer)
                        // let logMan = transfer.initiator;
                        // console.log(logMan);
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Transfer',
                                //@ts-ignore
                                activity: `You Approved a cylinder transfer request from ${transfer.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(transfer.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "New cylinder transfer",
                            content: `A cylinder transfer has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
                            user: apUser
                        });
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
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Cylinder Transfer',
                                //@ts-ignore
                                activity: `You Approved a cylinder transfer request from ${transfer.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(transfer.initiator);
                        yield new mail_1.default().push({
                            subject: "New cylinder transfer",
                            content: `A Cylinder transfer you initiated has been approved to view ${static_1.default.FRONTEND_URL}/fetch-transfer/${transfer._id}`,
                            user: apUser
                        });
                        let cylinders = transfer.cylinders;
                        if (transfer.type == transferCylinder_1.TransferType.TEMPORARY || transfer.type == transferCylinder_1.TransferType.PERMANENT) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.assignedTo = transfer.to;
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.CUSTOMER;
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
                        else if (transfer.type == transferCylinder_1.TransferType.CHANGEGAS) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.gasType = transfer.gasType;
                                yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                            }
                        }
                        else if (transfer.type == transferCylinder_1.TransferType.BRANCH) {
                            for (let cylinder of cylinders) {
                                let cyl = yield this.registerCylinder.findById(cylinder);
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.toBranch = transfer.toBranch;
                                //@ts-ignore
                                cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.BRANCH;
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
    returnCylinder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (let cylinder of data.cylinders) {
                    let cyl = yield this.registerCylinder.findById(cylinder);
                    //@ts-ignore
                    cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.ASNL;
                    //@ts-ignore
                    cyl === null || cyl === void 0 ? void 0 : cyl.toBranch = cyl === null || cyl === void 0 ? void 0 : cyl.branch;
                    cyl === null || cyl === void 0 ? void 0 : cyl.save();
                }
                return Promise.resolve({
                    message: 'cylinders returned'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    faultyCylinder(cylinderId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(cylinderId);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('cylinder not found');
                }
                //@ts-ignore
                cylinder.condition = cylinder_1.CylinderCondition.FAULTY;
                yield (cylinder === null || cylinder === void 0 ? void 0 : cylinder.save());
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Cylinder Faulty',
                        //@ts-ignore
                        activity: `You marked ${cylinder.cylinderNumber | cylinder.assignedNumber} as a faulty cylinder`,
                        time: new Date().toISOString()
                    }
                });
                let apUser = yield this.user.findOne({ role: 'production', subrole: 'head of department', branch: cylinder.branch });
                yield new mail_1.default().push({
                    subject: "Faulty cylinder",
                    content: `A cylinder has been assigned as faulty and requires your attenction. click to view ${static_1.default.FRONTEND_URL}/registered-cylinder-details/${cylinder._id}`,
                    user: apUser
                });
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fixedFaultyCylinder(cylinderId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(cylinderId).populate([
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'branch', model: 'branches' },
                    { path: 'gasType', model: 'cylinder' },
                ]);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('cylinder not found');
                }
                //@ts-ignore
                cylinder.condition = cylinder_1.CylinderCondition.GOOD;
                yield (cylinder === null || cylinder === void 0 ? void 0 : cylinder.save());
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Cylinder Faulty',
                        //@ts-ignore
                        activity: `You marked ${cylinder.cylinderNumber | cylinder.assignedNumber} as a fixed cylinder`,
                        time: new Date().toISOString()
                    }
                });
                let apUser = yield this.user.findOne({ role: 'sales', subrole: 'head of department', branch: cylinder.branch });
                yield new mail_1.default().push({
                    subject: "Faulty cylinder",
                    content: `A faulty cylinder has been fixed. click to view ${static_1.default.FRONTEND_URL}/registered-cylinder-details/${cylinder._id}`,
                    user: apUser
                });
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTransferRequets(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = mongoose.Types.ObjectId;
                const { search, filter } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'gasType', model: 'cylinder' },
                        { path: 'initiator', model: 'User' },
                        { path: 'to', model: 'customer' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'toBranch', model: 'branches' },
                        { path: 'branch', model: 'branches' }
                    ] });
                let aggregate;
                const aggregate1 = this.transfer.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { transferStatus: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ""
                                            } }
                                    ] },
                                { type: filter === null || filter === void 0 ? void 0 : filter.toLowerCase() },
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    }
                ]);
                const aggregate2 = this.transfer.aggregate([
                    {
                        $match: {
                            $or: [
                                { transferStatus: {
                                        $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ""
                                    } }
                            ],
                            $and: [
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    }
                ]);
                if ((search === null || search === void 0 ? void 0 : search.length) && (filter === null || filter === void 0 ? void 0 : filter.length)) {
                    aggregate = aggregate1;
                }
                else if ((search === null || search === void 0 ? void 0 : search.length) && !(filter === null || filter === void 0 ? void 0 : filter.length)) {
                    aggregate = aggregate2;
                }
                //@ts-ignore
                let transfers = yield this.transfer.aggregatePaginate(aggregate, options);
                for (let trans of transfers.docs) {
                    let gasType = yield this.cylinder.findById(trans.gasType);
                    trans.gasType = gasType;
                    let initiator = yield this.user.findById(trans.initiator);
                    trans.initiator = initiator;
                    let to = yield this.user.findById(trans.to);
                    trans.to = to;
                    let nextApprovalOfficer = yield this.user.findById(trans.nextApprovalOfficer);
                    trans.nextApprovalOfficer = nextApprovalOfficer;
                    let toBranch = yield this.branch.findById(trans.toBranch);
                    trans.toBranch = toBranch;
                    let branch = yield this.branch.findById(trans.branch);
                    trans.branch = branch;
                }
                // if(search?.length) {
                //   if(filter?.length) {
                //     //@ts-ignore
                //     transfers = await this.transfer.paginate({branch:user.branch,$or:[
                //       {type:filter?.toLowerCase()}
                //     ], $and:[{transferStatus:search?.toLowerCase()}]},options);
                //   }else {
                //     //@ts-ignore
                //     transfers = await this.transfer.paginate({branch:user.branch,$or:[
                //       {type:filter?.toLowerCase()}
                //     ]},options);
                //   }
                // }else {
                //    //@ts-ignore
                //     transfers = await this.transfer.paginate({branch:user.branch},options);
                // }
                const transferReq = yield this.transfer.find({ branch: user.branch });
                let totalApproved = transferReq.filter(
                //@ts-ignore
                transfer => transfer.transferStatus == transferCylinder_1.TransferStatus.COMPLETED);
                let totalPending = transferReq.filter(
                //@ts-ignore
                transfer => transfer.transferStatus == transferCylinder_1.TransferStatus.PENDING);
                return Promise.resolve({
                    transfer: transfers,
                    counts: {
                        totalApproved: totalApproved.length | 0,
                        totalPending: totalPending.length | 0,
                        totalTransfers: transferReq.length | 0
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchChangeCylinderRequest(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const changeRequests = yield this.transfer.paginate({ branch: user.branch, type: transferCylinder_1.TransferType.CHANGEGAS }, Object.assign({}, query));
                return Promise.resolve(changeRequests);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTransferDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transfer = yield this.transfer.findById(id).populate([
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'cylinders', model: 'registered-cylinders' },
                    { path: 'assignedTo', model: 'customer' },
                    { path: 'gasType', model: 'cylinder' },
                    { path: 'branch', model: 'branches' }
                ]);
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
                const { search } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'gasType', model: 'cylinder' },
                        { path: 'branch', model: 'branches' },
                        { path: 'to', model: 'customer' }
                    ] });
                let transfers;
                if (!(search === null || search === void 0 ? void 0 : search.length)) {
                    //@ts-ignore
                    transfers = yield this.transfer.paginate({
                        branch: user.branch,
                        transferStatus: transferCylinder_1.TransferStatus.PENDING,
                        nextApprovalOfficer: `${user._id}`,
                        $or: [{ type: search === null || search === void 0 ? void 0 : search.toLowerCase() }
                        ]
                    }, options);
                }
                else {
                    //@ts-ignore
                    transfers = yield this.transfer.paginate({
                        branch: user.branch,
                        transferStatus: transferCylinder_1.TransferStatus.PENDING,
                        nextApprovalOfficer: `${user._id}`
                    }, options);
                }
                //@ts-ignore
                // let startStage = transfers.docs.filter(transfer=> {
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
                //@ts-ignore
                // let stage1 = transfers.filter(transfer=>{
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
                //@ts-ignore
                // let stage2 = transfers.filter(transfer=>{
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
                return Promise.resolve(transfers);
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
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Registered cylinder',
                        //@ts-ignore
                        activity: `You deleted a registered cylinder`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve({
                    message: 'Cylinder deleted'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomerCylinders(query, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                let options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'gasType', model: 'cylinder' },
                        { path: 'assignedTo', model: 'customer' }
                    ] });
                //@ts-ignore
                let cylinders;
                if (!(search === null || search === void 0 ? void 0 : search.length)) {
                    //@ts-ignore
                    cylinders = yield this.registerCylinder.paginate({ assignedTo: customerId, $or: [
                            { cylinderNumber: search === null || search === void 0 ? void 0 : search.toLowerCase() },
                            { assignedNumber: search === null || search === void 0 ? void 0 : search.toLowerCase() }
                        ] }, options);
                }
                else {
                    //@ts-ignore
                    cylinders = yield this.registerCylinder.paginate({ assignedTo: customerId }, options);
                }
                return Promise.resolve(cylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTransferReport(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, filter } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'gasType', model: 'cylinder' },
                        { path: 'branch', model: 'branches' },
                        { path: 'to', model: 'customer' }
                    ] });
                //@ts-ignore
                const transfers = yield this.transfer.paginate({
                    branch: user.branch, TransferStatus: `${transferCylinder_1.TransferStatus.COMPLETED}`,
                    $or: [
                        { type: search === null || search === void 0 ? void 0 : search.toLowerCase() }
                    ]
                }, Object.assign({}, query));
                //@ts-ignore
                // const completed = transfers.docs.filter(transfer=> transfer.transferStatus == `${TransferStatus.COMPLETED}`);
                return Promise.resolve(transfers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    cylinderReturned(cylinderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.registerCylinder.findById(cylinderId);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('this cylinder mat have been deleted');
                }
                cylinder.holder = registeredCylinders_1.cylinderHolder.ASNL;
                yield cylinder.save();
                return cylinder;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Cylinder;
//# sourceMappingURL=index.js.map