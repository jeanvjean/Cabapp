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
const transferCylinder_1 = require("../../models/transferCylinder");
const module_1 = require("../module");
const registeredCylinders_1 = require("../../models/registeredCylinders");
const exceptions_1 = require("../../exceptions");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
const logs_1 = require("../../util/logs");
const token_1 = require("../../util/token");
class Sale extends module_1.default {
    constructor(props) {
        super();
        this.sales = props.sales;
        this.user = props.user;
        this.cylinder = props.cylinder;
        this.purchase = props.purchase;
    }
    createSalesRequisition(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sales = new this.sales(data);
                sales.branch = user.branch;
                sales.status = transferCylinder_1.TransferStatus.PENDING;
                sales.preparedBy = user._id;
                yield sales.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Sales requisition',
                        activity: 'Created asales requisition awaiting approval',
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(sales);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchSalesRequisition(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { customer, fromDate, toDate, gasVolume, search } = query;
                let options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'preparedBy', model: 'User' }
                    ]
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (customer) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { customer: customer });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $gte: new Date(fromDate) } });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $lte: new Date(toDate) } });
                }
                if (gasVolume) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'cylinders.volume': gasVolume });
                }
                if (search) {
                    or.push({ customer: new RegExp(search, 'gi') });
                    or.push({ gasVolume: new RegExp(search, 'gi') });
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                    or.push({ status: new RegExp(search, 'gi') });
                }
                //@ts-ignore
                const sales = yield this.sales.paginate(q, options);
                return Promise.resolve(sales);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchSalesReqDetails(salesId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sales = yield this.sales.findById(salesId).populate([
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'preparedBy', model: 'User' }
                ]);
                return Promise.resolve(sales);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveSalesRequisition(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield token_1.passWdCheck(user, data.password);
                // let loginUser = await this.user.findById(user._id).select('+password');
                // let matchPWD = await loginUser?.comparePWD(data.password, user.password);
                // if(!matchPWD) {
                //   throw new BadInputFormatException('Incorrect password... please check the password');
                // }
                const sales = yield this.sales.findById(data.salesId).populate({
                    path: 'initiator', model: 'User'
                });
                if (!sales) {
                    throw new exceptions_1.BadInputFormatException('sales requisition not found');
                }
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((sales === null || sales === void 0 ? void 0 : sales.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = sales.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = sales.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            sales.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        sales.tracking.push(track);
                        sales.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        sales.initiated = true;
                        sales.initiator = user._id;
                        sales.nextApprovalOfficer = AO[0].id;
                        // sales.comments.push({
                        //   comment:data.comment,
                        //   commentBy:user._id
                        // })
                        yield sales.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Sales requisition',
                                //@ts-ignore
                                activity: `rejected a requisition made by ${sales.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(sales.nextApprovalOfficer);
                        new mail_1.default().push({
                            subject: "Sales Requisition",
                            content: `A Sales requisition you approved failed secondary approval and requires your attention. click to view ${static_1.default.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(sales);
                    }
                    else if ((sales === null || sales === void 0 ? void 0 : sales.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = sales.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        let track = {
                            title: "Approval Process",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: AO[0].id
                        };
                        let checkOfficer = sales.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            sales.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        sales.tracking.push(track);
                        sales.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        sales.nextApprovalOfficer = AO[0].id;
                        // sales.comments.push({
                        //   comment:data.comment,
                        //   commentBy:user._id
                        // })
                        yield sales.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Sales requisition',
                                //@ts-ignore
                                activity: `rejected a requisition made by ${sales.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(sales.nextApprovalOfficer);
                        new mail_1.default().push({
                            subject: "Sales Requisition",
                            content: `A Sales requisition you approved failed secondary approval and requires your attention. click to view ${static_1.default.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(sales);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((sales === null || sales === void 0 ? void 0 : sales.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
                        };
                        let checkOfficer = sales.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            sales.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        sales.tracking.push(track);
                        sales.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        sales.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        // sales.comments.push({
                        //   comment:data.comment,
                        //   commentBy:user._id
                        // })
                        yield sales.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Sales requisition',
                                //@ts-ignore
                                activity: `Approved a sales requisition made by ${sales.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(sales.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Sales Requisition",
                            content: `A Sales requisition has been created and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(sales);
                    }
                    else if ((sales === null || sales === void 0 ? void 0 : sales.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let branchAdmin = yield this.user.findOne({ branch: hod === null || hod === void 0 ? void 0 : hod.branch, subrole: "superadmin" });
                        let track = {
                            title: "Initiate Transfer",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            //@ts-ignore
                            nextApprovalOfficer: branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id
                        };
                        // console.log(track);
                        let checkOfficer = sales.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            sales.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        sales.tracking.push(track);
                        sales.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        sales.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
                        // sales.comments.push({
                        //   comment:data.comment,
                        //   commentBy:user._id
                        // })
                        yield sales.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Sales requisition',
                                //@ts-ignore
                                activity: `Approved a sales requisition made by ${sales.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(sales.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Sales Requisition",
                            content: `A Sales requisition has been created and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(sales);
                    }
                    else if ((sales === null || sales === void 0 ? void 0 : sales.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "Initiate Transfer",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                        };
                        let checkOfficer = sales.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            sales.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        sales.tracking.push(track);
                        sales.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        sales.status = transferCylinder_1.TransferStatus.COMPLETED;
                        // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                        // sales.comments.push({
                        //   comment:data.comment,
                        //   commentBy:user._id
                        // });
                        // console.log(sales);
                        yield sales.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Sales requisition',
                                //@ts-ignore
                                activity: `Approved a sales requisition made by ${sales.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(sales.initiator);
                        yield new mail_1.default().push({
                            subject: "Sales Requisition",
                            content: `A Sales requisition has been approval. click to view ${static_1.default.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(sales);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPendingRequisitionApproval(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { stage, page, limit, search, cylinderNumber, cylinderType, fromDate, toDate } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10
                };
                let q = {
                    branch: user.branch,
                    status: transferCylinder_1.TransferStatus.PENDING,
                    populate: [
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'preparedBy', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' }
                    ]
                };
                let or = [];
                if (search) {
                    or.push({ customerName: new RegExp(search, 'gi') });
                    or.push({ approvalStage: new RegExp(search, 'gi') });
                    or.push({ cyliderType: new RegExp(search, 'gi') });
                    or.push({ cyliderType: new RegExp(search, 'gi') });
                    or.push({ 'cylinders.cylinderNumber': new RegExp(search, 'gi') });
                    or.push({ 'cylinders.volume': new RegExp(search, 'gi') });
                }
                if (stage) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { approvalStage: stage });
                }
                if (cylinderNumber) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'cylinders.cylinderNumber': cylinderNumber });
                }
                if (cylinderType) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'cylinders.cylinderType': cylinderType });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { '$gte': new Date(fromDate) } });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { '$lte': new Date(toDate) } });
                }
                //@ts-ignore
                const sales = yield this.sales.paginate(q, options);
                return Promise.resolve(sales);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    returnedCylinder(cylinderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinder = yield this.cylinder.findById(cylinderId);
                if (!cylinder) {
                    throw new exceptions_1.BadInputFormatException('cylinder not found');
                }
                cylinder.cylinderType = registeredCylinders_1.TypesOfCylinders.BUFFER;
                yield cylinder.save();
                return Promise.resolve(cylinder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    cylinderTransactions(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'assignedTo', model: 'customer' }
                    ] });
                //@ts-ignore
                const cylinders = yield this.cylinder.paginate({ branch: user.branch, cylinderType: registeredCylinders_1.TypesOfCylinders.ASSIGNED }, options);
                return Promise.resolve(cylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    cylinderTransactionsDownload(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const options = {
                //   ...query,
                //   populate:[
                //     {path:'assignedTo', model:'customer'}
                //   ]
                // }
                //@ts-ignore
                const cylinders = yield this.cylinder.find({ branch: user.branch, cylinderType: registeredCylinders_1.TypesOfCylinders.ASSIGNED });
                return Promise.resolve(cylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    salesOrderTransaction(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const salesOrders = yield this.sales.find({ branch: user.branch }, Object.assign({}, query));
                //@ts-ignore
                const completed = yield this.sales.find({ branch: user.branch, status: transferCylinder_1.TransferStatus.COMPLETED }, Object.assign({}, query));
                //@ts-ignore
                const in_progress = yield this.sales.find({ branch: user.branch, status: transferCylinder_1.TransferStatus.PENDING }, Object.assign({}, query));
                return Promise.resolve({
                    orders: salesOrders,
                    completed,
                    pending: in_progress
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    salesOrderDownload(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const salesOrders = yield this.sales.find({ branch: user.branch });
                //@ts-ignore
                const completed = yield this.sales.find({ branch: user.branch, status: transferCylinder_1.TransferStatus.COMPLETED });
                //@ts-ignore
                const in_progress = yield this.sales.find({ branch: user.branch, status: transferCylinder_1.TransferStatus.PENDING });
                return Promise.resolve({
                    orders: salesOrders,
                    completed,
                    pending: in_progress
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    purchaseOrderReport(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: "nextApprovalOfficer", model: "User" },
                        { path: "initiator", model: "User" },
                        { path: "branch", model: "branches" },
                        { path: "customer", model: "customer" }
                    ]
                };
                //@ts-ignore
                const purchaseOrder = yield this.purchase.paginate({ branch: user.branch }, options);
                //@ts-ignore
                const completed = yield this.purchase.paginate({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.COMPLETED }, options);
                //@ts-ignore
                const pending = yield this.purchase.paginate({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.PENDING }, options);
                return Promise.resolve({
                    orders: purchaseOrder,
                    completed,
                    pending
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    purchaseReportDowndload(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let options = {
                    // page: query.page || 1,
                    // limit:query.limit || 10,
                    populate: [
                        { path: "nextApprovalOfficer", model: "User" },
                        { path: "initiator", model: "User" },
                        { path: "branch", model: "branches" },
                        { path: "customer", model: "customer" }
                    ]
                };
                //@ts-ignore
                const purchaseOrder = yield this.purchase.find({ branch: user.branch }, options);
                //@ts-ignore
                const completed = yield this.purchase.find({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.COMPLETED }, options);
                //@ts-ignore
                const pending = yield this.purchase.find({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.PENDING }, options);
                return Promise.resolve({
                    orders: purchaseOrder,
                    completed,
                    pending
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Sale;
//# sourceMappingURL=index.js.map