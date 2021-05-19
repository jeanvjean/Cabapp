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
const bcryptjs_1 = require("bcryptjs");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
class ProductionSchedule extends module_1.default {
    constructor(props) {
        super();
        this.production = props.production;
        this.user = props.user;
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
                production.comments.push({
                    comment: data.comment,
                    commentBy: user._id
                });
                yield production.save();
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
                let matchPWD = bcryptjs_1.compareSync(data.password, user.password);
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                const production = yield this.production.findById(data.productionId);
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = production.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        // let track = {
                        //   title:"Approval Process",
                        //   stage:stagesOfApproval.STAGE2,
                        //   status:ApprovalStatus.REJECTED,
                        //   dateApproved:new Date().toISOString(),
                        //   approvalOfficer:user._id,
                        //   nextApprovalOfficer:AO[0].id
                        // }
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
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production schedule You initiated failed approval please attend to the corrections. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                    else if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = production.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        // let track = {
                        //   title:"Approval Process",
                        //   stage:stagesOfApproval.STAGE3,
                        //   status:ApprovalStatus.REJECTED,
                        //   dateApproved:new Date().toISOString(),
                        //   approvalOfficer:user._id,
                        //   nextApprovalOfficer:AO[0].id
                        // }
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
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        new mail_1.default().push({
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
                        // let track = {
                        //   title:"Approval Prorcess",
                        //   stage:stagesOfApproval.STAGE1,
                        //   status:ApprovalStatus.APPROVED,
                        //   dateApproved:new Date().toISOString(),
                        //   approvalOfficer:user._id,
                        //   nextApprovalOfficer:hod?._id
                        // }
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
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                    else if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        // let track = {
                        //   title:"Initiate Transfer",
                        //   stage:stagesOfApproval.STAGE2,
                        //   status:ApprovalStatus.APPROVED,
                        //   dateApproved:new Date().toISOString(),
                        //   approvalOfficer:user._id,
                        //   //@ts-ignore
                        //   nextApprovalOfficer:hod?.branch.branchAdmin
                        // }
                        // console.log(track);
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
                        production.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
                        production.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Authorizing officer'
                        });
                        yield production.save();
                        let approvalUser = yield this.user.findById(production.nextApprovalOfficer);
                        new mail_1.default().push({
                            subject: "Production Schedule",
                            content: `A production has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-prodctionSchedule/${production._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(production);
                    }
                    else if ((production === null || production === void 0 ? void 0 : production.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        // let track = {
                        //   title:"Initiate Transfer",
                        //   stage:stagesOfApproval.STAGE3,
                        //   status:ApprovalStatus.APPROVED,
                        //   dateApproved:new Date().toISOString(),
                        //   approvalOfficer:user._id,
                        //   // nextApprovalOfficer:data.nextApprovalOfficer
                        // }
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
                        transfer.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Approving officer'
                        });
                        yield production.save();
                        let approvalUser = yield this.user.findById(production.initiator);
                        new mail_1.default().push({
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
                const productions = yield this.production.find(Object.assign(Object.assign({}, query), { branch: user.branch }));
                let startStage = productions.filter(production => {
                    if (production.approvalStage == transferCylinder_1.stagesOfApproval.START) {
                        for (let tofficer of production.approvalOfficers) {
                            if (`${tofficer.id}` == `${user._id}`) {
                                if (tofficer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1) {
                                    return production;
                                }
                            }
                            else if (`${production.nextApprovalOfficer}` == `${user._id}`) {
                                return production;
                            }
                        }
                    }
                });
                let stage1 = productions.filter(production => {
                    if (production.approvalStage == transferCylinder_1.stagesOfApproval.STAGE1) {
                        for (let tofficer of production.approvalOfficers) {
                            if (`${tofficer.id}` == `${user._id}`) {
                                if (tofficer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2) {
                                    return production;
                                }
                            }
                            else if (`${production.nextApprovalOfficer}` == `${user._id}`) {
                                return production;
                            }
                        }
                    }
                });
                let stage2 = productions.filter(production => {
                    if (production.approvalStage == transferCylinder_1.stagesOfApproval.STAGE2) {
                        for (let tofficer of production.approvalOfficers) {
                            if (`${tofficer.id}` == `${user._id}`) {
                                if (tofficer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE3) {
                                    return production;
                                }
                            }
                            else if (`${production.nextApprovalOfficer}` == `${user._id}`) {
                                return production;
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
    viewProductionSchedule(productionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const production = yield this.production.findById(productionId);
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
                const productions = yield this.production.find(Object.assign(Object.assign({}, query), { branch: user.branch }));
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
                production.produced = true;
                yield production.save();
                let approvalUser = yield this.user.findById({ role: 'sales', subrole: 'head of department', branch: production.branch });
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
                yield this.production.findByIdAndUpdate(productionId, { cylinders }, { new: true });
                return Promise.resolve(production);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = ProductionSchedule;
//# sourceMappingURL=index.js.map