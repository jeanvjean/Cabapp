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
                const sales = yield this.sales.find(Object.assign(Object.assign({}, query), { branch: user.branch }));
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
                const sales = yield this.sales.findById(salesId);
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
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                const sales = yield this.sales.findById(data.salesId);
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
                        let approvalUser = yield this.user.findById(sales.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Sales Requisition",
                            content: `A Sales requisition has been created and requires your approval. click to view ${static_1.default.FRONTEND_URL}/fetch-sales-req/${sales._id}`,
                            user: approvalUser
                        });
                        return Promise.resolve(sales);
                    }
                    else if ((sales === null || sales === void 0 ? void 0 : sales.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
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
                        sales.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
                        // sales.comments.push({
                        //   comment:data.comment,
                        //   commentBy:user._id
                        // })
                        yield sales.save();
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
    fetchPendingRequisitionApproval(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sales = yield this.sales.find({ status: transferCylinder_1.TransferStatus.PENDING, branch: user.branch });
                let startStage = sales.filter(transfer => {
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
                let stage1 = sales.filter(transfer => {
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
                let stage2 = sales.filter(transfer => {
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
    cylinderTransactions(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.cylinder.find({ branch: user.branch, cylinderType: registeredCylinders_1.TypesOfCylinders.ASSIGNED }).populate({ path: 'assignedTo', model: 'customer' });
                return Promise.resolve(cylinders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    salesOrderTransaction(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const salesOrders = yield this.sales.find({ branch: user.branch });
                const completed = salesOrders.filter(sales => sales.status == transferCylinder_1.TransferStatus.COMPLETED);
                const in_progress = salesOrders.filter(sales => sales.status == transferCylinder_1.TransferStatus.PENDING);
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
    purchaseOrderReport(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const purchaseOrder = yield this.purchase.find({ branch: user.branch });
                const completed = purchaseOrder.filter(order => order.approvalStatus == transferCylinder_1.TransferStatus.COMPLETED);
                const pending = purchaseOrder.filter(order => order.approvalStatus == transferCylinder_1.TransferStatus.PENDING);
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