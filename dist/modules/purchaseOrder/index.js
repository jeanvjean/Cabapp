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
const module_1 = require("../module");
const transferCylinder_1 = require("../../models/transferCylinder");
const exceptions_1 = require("../../exceptions");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
const logs_1 = require("../../util/logs");
const token_1 = require("../../util/token");
class PurchaseOrder extends module_1.default {
    constructor(props) {
        super();
        this.purchase = props.purchase;
        this.user = props.user;
    }
    createPurchaseOrder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const purchase = new this.purchase(Object.assign(Object.assign({}, data), { branch: user.branch, initiator: user._id }));
                let ex = yield this.purchase.find({}).sort({ initNum: -1 }).limit(1);
                let on;
                if (ex[0]) {
                    on = ex[0].initNum + 1;
                }
                else {
                    on = 1;
                }
                let orderNumber = token_1.padLeft(on, 6, '');
                purchase.orderNumber = 'O' + orderNumber;
                purchase.comments.push({
                    comment: data.comment,
                    commentBy: user._id
                });
                purchase.approvalOfficers.push({
                    name: user.name,
                    id: user._id,
                    office: user.subrole,
                    department: user.role,
                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                });
                let hod = yield this.user.findOne({ role: user.role, subrole: 'head of department', branch: user.branch });
                purchase.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                yield purchase.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Purchase order',
                        //@ts-ignore
                        activity: `You created a new purchase order`,
                        time: new Date().toISOString()
                    }
                });
                let approvalUser = yield this.user.findById(purchase.nextApprovalOfficer);
                yield new mail_1.default().push({
                    subject: "Purchase Order",
                    content: `A purchase order has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-order/${purchase._id}`,
                    user: approvalUser
                });
                return Promise.resolve(purchase);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchOrderDetails(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.purchase.findById(orderId).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: "supplier", model: "supplier" },
                    { path: "branch", model: "branches" },
                    { path: "fromBranch", model: "branches" }
                ]);
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPurchaseOrders(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { page, limit, search, fromBranch, branch, approvalStatus, supplier, fromDate, toDate } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: "supplier", model: "supplier" },
                        { path: "branch", model: "branches" },
                        { path: "fromBranch", model: "branches" }
                    ]
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (fromBranch) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { fromBranch: fromBranch });
                }
                if (branch) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { branch: branch });
                }
                if (supplier) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { supplier: supplier });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { date: new Date(fromDate) });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { date: new Date(toDate) });
                }
                if (approvalStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { approvalStatus: approvalStatus });
                }
                if (search) {
                    or.push({ type: new RegExp(search, 'gi') });
                    or.push({ 'cylinders.volume': new RegExp(search, 'gi') });
                    or.push({ approvalStage: new RegExp(search, 'gi') });
                    or.push({ orderNumber: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const purchases = yield this.purchase.paginate(q, options);
                //@ts-ignore
                const approved = yield this.purchase.paginate({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.COMPLETED }, options);
                //@ts-ignore
                const pending = yield this.purchase.paginate({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.PENDING }, options);
                return Promise.resolve({
                    purchaseOrders: purchases,
                    approvedOrders: approved,
                    pendingOrders: pending
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approvePurchaseOrder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                const purchase = yield this.purchase.findById(data.purchaseId).populate({
                    path: 'initiator', model: 'User'
                });
                if (!purchase) {
                    throw new exceptions_1.BadInputFormatException('purchase order not found');
                }
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((purchase === null || purchase === void 0 ? void 0 : purchase.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = purchase.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let checkOfficer = purchase.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            purchase.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        //   purchase.tracking.push(track)
                        purchase.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        purchase.nextApprovalOfficer = AO[0].id;
                        purchase.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield purchase.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Purchase Order',
                                //@ts-ignore
                                activity: `You rejected a purchase order approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(purchase.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Purchase Order",
                            content: `A purchase order you scheduled failed approval and requires your attention. click to view ${static_1.default.FRONTEND_URL}/fetch-order/${purchase._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(purchase);
                    }
                    else if ((purchase === null || purchase === void 0 ? void 0 : purchase.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = purchase.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        let checkOfficer = purchase.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            purchase.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        //   purchase.tracking.push(track);
                        purchase.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        purchase.nextApprovalOfficer = AO[0].id;
                        purchase.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield purchase.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Purchase Order',
                                //@ts-ignore
                                activity: `You rejected a purchase order approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(purchase.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Purchase Order",
                            content: `A purchase order you Approved failed secondary approval and requires your attention. click to view ${static_1.default.FRONTEND_URL}/fetch-order/${purchase._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(purchase);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((purchase === null || purchase === void 0 ? void 0 : purchase.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let checkOfficer = purchase.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            purchase.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        //   purchase.tracking.push(track)
                        purchase.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        purchase.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        purchase.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield purchase.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Purchase Order',
                                //@ts-ignore
                                activity: `You Approved a purchase order approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(purchase.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Purchase Order",
                            content: `A purchase order has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-order/${purchase._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(purchase);
                    }
                    else if ((purchase === null || purchase === void 0 ? void 0 : purchase.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let checkOfficer = purchase.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            purchase.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        //   purchase.tracking.push(track)
                        let branchAdmin = yield this.user.findOne({ branch: hod === null || hod === void 0 ? void 0 : hod.branch, subrole: "superadmin" });
                        purchase.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        purchase.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
                        purchase.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Authorizing officer'
                        });
                        yield purchase.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Purchase Order',
                                //@ts-ignore
                                activity: `You Approved a purchase order approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(purchase.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Purchase Order",
                            content: `A purchase order has been scheduled and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-order/${purchase._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(purchase);
                    }
                    else if ((purchase === null || purchase === void 0 ? void 0 : purchase.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let checkOfficer = purchase.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            purchase.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        //   purchase.tracking.push(track)
                        purchase.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        purchase.approvalStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                        purchase.comments.push({
                            comment: data.comment,
                            commentBy: user._id,
                            officer: 'Approving officer'
                        });
                        yield purchase.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Purchase Order',
                                //@ts-ignore
                                activity: `You Approved a purchase order approval request made by ${purchase.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let approvalUser = yield this.user.findById(purchase.initiator);
                        yield new mail_1.default().push({
                            subject: "Purchase Order",
                            content: `A purchase order has been approved. click to view ${static_1.default.FRONTEND_URL}/fetch-order/${purchase._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(purchase);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPurchaseOrderRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { page, limit, search, fromBranch, branch, approvalStatus, supplier, fromDate, toDate } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: "supplier", model: "supplier" },
                        { path: "branch", model: "branches" },
                        { path: "fromBranch", model: "branches" }
                    ]
                };
                let q = {
                    branch: user.branch,
                    nextApprovalOfficer: user._id,
                    approvalStatus: transferCylinder_1.TransferStatus.PENDING
                };
                let or = [];
                if (fromBranch) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { fromBranch: fromBranch });
                }
                if (branch) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { branch: branch });
                }
                if (supplier) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { supplier: supplier });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { date: new Date(fromDate) });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { date: new Date(toDate) });
                }
                if (approvalStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { approvalStatus: approvalStatus });
                }
                if (search) {
                    or.push({ type: new RegExp(search, 'gi') });
                    or.push({ 'cylinders.volume': new RegExp(search, 'gi') });
                    or.push({ approvalStage: new RegExp(search, 'gi') });
                    or.push({ orderNumber: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const purchaseOrders = yield this.purchase.paginate(q, options);
                return Promise.resolve(purchaseOrders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = PurchaseOrder;
//# sourceMappingURL=index.js.map