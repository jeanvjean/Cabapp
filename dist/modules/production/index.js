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
const transferCylinder_1 = require("../../models/transferCylinder");
const module_1 = require("../module");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
const logs_1 = require("../../util/logs");
const token_1 = require("../../util/token");
const walk_in_customers_1 = require("../../models/walk-in-customers");
class ProductionSchedule extends module_1.default {
    constructor(props) {
        super();
        this.production = props.production;
        this.user = props.user;
        this.regCylinder = props.regCylinder;
        this.ecr = props.ecr;
    }
    createProductionSchedule(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const production = new this.production(data);
                production.initiator = user._id;
                production.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                let hod = yield this.user.findOne({ role: user.role, subrole: 'head of department', branch: user.branch });
                production.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                production.branch = user.branch;
                production.approvalOfficers.push({
                    name: user.name,
                    id: user._id,
                    office: user.subrole,
                    department: user.role,
                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                });
                let sche = yield this.production.find({}).sort({ initNum: -1 }).limit(1);
                let sn;
                if (sche[0]) {
                    sn = sche[0].initNum + 1;
                }
                else {
                    sn = 1;
                }
                let num = token_1.padLeft(sn, 6, '');
                production.productionNo = "PN" + num;
                production.initNum = sn;
                production.comments.push({
                    comment: data.comment,
                    commentBy: user._id
                });
                /**remove cylinders from ecr */
                let fEcr = yield this.ecr.findById(production.ecr);
                if (!fEcr) {
                    throw new exceptions_1.BadInputFormatException('ecr id not found');
                }
                let remain = [];
                for (let cyl of production.cylinders) {
                    let cylinder = yield this.regCylinder.findById(cyl);
                    if (!cylinder) {
                        throw new exceptions_1.BadInputFormatException(`cylinder with this id does not seem to be found`);
                    }
                    if (!fEcr.cylinders.includes(cylinder._id)) {
                        throw new exceptions_1.BadInputFormatException(`cylinder with this id does not seem to be found on the ECR`);
                    }
                    if (fEcr.cylinders.includes(cylinder._id)) {
                        fEcr.removeArr.push(cylinder._id);
                    }
                    cylinder.tracking.push({
                        heldBy: "asnl",
                        name: "Production",
                        location: 'Production Department',
                        date: new Date().toISOString()
                    });
                    yield cylinder.save();
                }
                for (let cyl of fEcr.cylinders) {
                    if (!fEcr.removeArr.includes(cyl)) {
                        remain.push(cyl);
                    }
                }
                if (fEcr.cylinders.length <= 0) {
                    fEcr.closed = true;
                }
                fEcr.cylinders = remain;
                yield fEcr.save();
                /** remove cylinders from ecr*/
                yield production.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Production Schedule',
                        //@ts-ignore
                        activity: `You Created a new production schedule`,
                        time: new Date().toISOString()
                    }
                });
                let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                new mail_1.default().push({
                    subject: "Production Schedule",
                    content: `A production has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                    user: approvalUser
                });
                return Promise.resolve(production);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveProductionSchedule(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield token_1.passWdCheck(user, data.password);
                const production = yield this.production.findById(data.productionId).populate([
                    { path: 'initiator', model: 'User' }
                ]);
                if (!production) {
                    throw new exceptions_1.BadInputFormatException('production schedule not found');
                }
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = production.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let checkOfficer = production.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            production.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        // production.tracking.push(track)
                        production.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        production.nextApprovalOfficer = AO[0].id;
                        production.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Authorizing officer'
                        });
                        yield production.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Production Schedule',
                                //@ts-ignore
                                activity: `You rejected a production Schedule approval request made by ${production.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production schedule You initiated failed approval please attend to the corrections. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                    else if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = production.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        let checkOfficer = production.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            production.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        // transfer.tracking.push(track);
                        production.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        production.nextApprovalOfficer = AO[0].id;
                        production.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Approving officer'
                        });
                        yield production.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'production schedule',
                                //@ts-ignore
                                activity: `You Rejected a production schedule approval request made by ${production.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production schedule You Approved failed secondary approval please attend to the corrections. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let checkOfficer = production.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            production.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        // transfer.tracking.push(track)
                        production.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        production.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        production.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                        });
                        yield production.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'production schedule',
                                //@ts-ignore
                                activity: `You Approved a production schedule approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                    else if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let branchAdmin = yield this.user.findOne({ branch: hod === null || hod === void 0 ? void 0 : hod.branch, subrole: "superadmin" });
                        let checkOfficer = production.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            production.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        // transfer.tracking.push(track)
                        production.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        production.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
                        production.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Authorizing officer'
                        });
                        yield production.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'production schedule',
                                //@ts-ignore
                                activity: `You Approved a production schedule approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                    else if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let checkOfficer = production.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            production.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        // transfer.tracking.push(track)
                        production.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        production.status = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                        production.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Approving officer'
                        });
                        yield production.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'production schedule',
                                //@ts-ignore
                                activity: `You Approved a production schedule approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(production.initiator);
                        yield new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production you scheduled scheduled has been approved. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPendingProductionApprovals(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { page, limit, search, fromDate, toDate } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10,
                    sort: { priority: 1 },
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: "cylinders", model: "registered-cylinders" },
                        { path: 'ecr', model: 'empty-cylinders' },
                        { path: 'branch', model: 'branches' }
                    ]
                };
                let q = {
                    branch: user.branch,
                    nextApprovalOfficer: user._id,
                    status: transferCylinder_1.TransferStatus.PENDING
                };
                let or = [];
                if (search) {
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                    or.push({ quantityToFill: new RegExp(search, 'gi') });
                    or.push({ status: new RegExp(search, 'gi') });
                    or.push({ productionNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $gte: new Date(fromDate) } });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $lte: new Date(toDate) } });
                }
                //@ts-ignore
                const productions = yield this.production.paginate(q, options);
                return Promise.resolve(productions);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    viewProductionSchedule(productionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const production = yield this.production.findById(productionId).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: "cylinders", model: "registered-cylinders" },
                    { path: 'ecr', model: 'empty-cylinders' },
                    { path: 'branch', model: 'branches' }
                ]);
                if (!production) {
                    throw new exceptions_1.BadInputFormatException('Production schedule not found');
                }
                return Promise.resolve(production);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchApprovedSchedules(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { page, limit, search, approvalStatus, ecr, fromDate } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: "cylinders", model: "registered-cylinders" },
                        { path: 'ecr', model: 'empty-cylinders' },
                        { path: 'branch', model: 'branches' }
                    ]
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (approvalStatus) {
                    or.push({ status: new RegExp(approvalStatus, 'gi') });
                }
                if (ecr) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { ecrNo: ecr });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { date: { '$eq': new Date(fromDate) } });
                }
                if (search) {
                    or.push({ productionNo: new RegExp(search, 'gi') });
                    or.push({ shift: new RegExp(search, 'gi') });
                    or.push({ quantityToFill: new RegExp(search, 'gi') });
                    or.push({ 'volumeToFill.value': new RegExp(search, 'gi') });
                    or.push({ 'priority': new RegExp(search, 'gi') });
                }
                //@ts-ignore
                const productions = yield this.production.paginate(q, options);
                // console.log(productions)
                return Promise.resolve(productions);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markCompletedProduction(productionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const production = yield this.production.findById(productionId);
                if (!production) {
                    throw new exceptions_1.BadInputFormatException('production schedule not found');
                }
                for (let cyl of production.cylinders) {
                    let cylinder = yield this.regCylinder.findById(cyl);
                    if ((cylinder === null || cylinder === void 0 ? void 0 : cylinder.cylinderStatus) !== walk_in_customers_1.WalkinCustomerStatus.FILLED) {
                        throw new exceptions_1.BadInputFormatException(`cylinder number ${cylinder === null || cylinder === void 0 ? void 0 : cylinder.cylinderNumber}, has not been filled, mark all filled cylinders in this schedule to proceed`);
                    }
                }
                production.produced = true;
                yield production.save();
                let approvalUser = yield this.user.findOne({ role: 'sales', subrole: 'head of department', branch: production.branch });
                new mail_1.default().push({
                    subject: "Production complete",
                    content: `Production schedule completed. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                    user: approvalUser
                });
                return Promise.resolve(production);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markcompletedCylinders(updateProduction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productionId, cylinders } = updateProduction;
                const production = yield this.production.findById(productionId);
                if (!production) {
                    throw new exceptions_1.BadInputFormatException('production schedule not found');
                }
                let notFound = [];
                for (let cyl of cylinders) {
                    if (production.cylinders.includes(cyl)) {
                        let c = yield this.regCylinder.findById(cyl);
                        if (c) {
                            //@ts-ignore
                            c.cylinderStatus = walk_in_customers_1.WalkinCustomerStatus.FILLED;
                            yield c.save();
                        }
                    }
                    else {
                        notFound.push(cyl);
                    }
                }
                let message = notFound.length > 0 ? "Some cylinders were not found in this schedule" : "cylinders have been set to filled";
                // await this.production.findByIdAndUpdate(productionId, {cylinders}, {new:true});
                return Promise.resolve({
                    message,
                    production,
                    not_found: notFound
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markFilledCylinders(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cylinder_ids, status } = data;
                let notFound = [];
                for (let cyl of cylinder_ids) {
                    let c = yield this.regCylinder.findById(cyl);
                    if (c) {
                        //@ts-ignore
                        if (status == walk_in_customers_1.WalkinCustomerStatus.EMPTY) {
                            c.cylinderStatus = walk_in_customers_1.WalkinCustomerStatus.EMPTY;
                        }
                        else if (status == walk_in_customers_1.WalkinCustomerStatus.FILLED) {
                            c.cylinderStatus = walk_in_customers_1.WalkinCustomerStatus.FILLED;
                        }
                        yield c.save();
                    }
                    else {
                        notFound.push(cyl);
                    }
                }
                let message = notFound.length > 0 ? "Some cylinders were not found in this " : "cylinders have been set to filled";
                return Promise.resolve({
                    message,
                    not_found: notFound
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = ProductionSchedule;
//# sourceMappingURL=index.js.map