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
class Product extends module_1.default {
    constructor(props) {
        super();
        this.product = props.product;
        this.supplier = props.supplier;
        this.inventory = props.inventory;
        this.disburse = props.disburse;
    }
    createProduct(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let findProduct = yield this.product.findOne({
                    partNumber: data.partNumber,
                    serialNumber: data.serialNumber,
                    asnlNumber: data.asnlNumber
                });
                if (findProduct) {
                    throw new exceptions_1.BadInputFormatException('this product serial number, asnl number and part number is already in the system');
                }
                let product = yield this.product.create(data);
                return Promise.resolve(product);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchProducts(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield this.product.find(query);
                // console.log(products);
                return Promise.resolve(products);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchProduct(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.product.findById(id);
                return Promise.resolve(product);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    createSupplier(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supplier = yield this.supplier.create(data);
                return Promise.resolve(supplier);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    addInventory(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inventory = yield this.inventory.create(data);
                return Promise.resolve(inventory);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    disburseProduct(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (data.nextApprovalOfficer == null) {
                    throw new exceptions_1.BadInputFormatException('please select the next approval stage officer');
                }
                const disbursement = new this.disburse(data);
                let track = {
                    title: "initiate disburse",
                    stage: transferCylinder_1.stagesOfApproval.STAGE1,
                    status: transferCylinder_1.ApprovalStatus.APPROVED,
                    approvalOfficer: user._id
                };
                disbursement.tracking.push(track);
                disbursement.approvalOfficers.push({
                    name: user.name,
                    id: user._id,
                    office: user.subrole,
                    department: user.role,
                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                });
                disbursement.disburseStatus = transferCylinder_1.TransferStatus.PENDING;
                disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                disbursement.comments.push({
                    comment: data.comment,
                    commentBy: user._id
                });
                yield disbursement.save();
                return Promise.resolve(disbursement);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveDisbursment(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursement = yield this.disburse.findById(data.id);
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = disbursement.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Corrections",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            approvalOfficer: AO[0].id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        return Promise.resolve({
                            message: "Rejected",
                            disbursement
                        });
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = disbursement.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Corrections",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            approvalOfficer: AO[0].id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        return Promise.resolve({
                            message: "Rejected",
                            disbursement
                        });
                    }
                }
                else {
                    if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = data.nextApprovalOfficer;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        return Promise.resolve({
                            message: "Approved",
                            disbursement
                        });
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = data.nextApprovalOfficer;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        return Promise.resolve({
                            message: "Approved",
                            disbursement
                        });
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        disbursement.disburseStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        disbursement.comment.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        return Promise.resolve({
                            message: "Approved",
                            disbursement
                        });
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchusersDisburseApprovals(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursement = yield this.disburse.find(query);
                const pendingDisbursement = disbursement.filter(disburse => disburse.disburseStatus == transferCylinder_1.TransferStatus.PENDING);
                let startStage = pendingDisbursement.filter(transfer => {
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
                let stage1 = pendingDisbursement.filter(transfer => {
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
                let stage2 = pendingDisbursement.filter(transfer => {
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
                let disbursements;
                if (user.subrole == 'superadmin') {
                    disbursements = stage2;
                }
                else if (user.subrole == 'head of department') {
                    disbursements = stage1;
                }
                else {
                    disbursements = startStage;
                }
                return Promise.resolve(disbursements);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDisbursement(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursement = yield this.disburse.findById(id);
                return Promise.resolve(disbursement);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDisburseRequests(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursements = yield this.disburse.find(query);
                let totalApproved = disbursements.filter(transfer => transfer.disburseStatus == transferCylinder_1.TransferStatus.COMPLETED);
                let totalPending = disbursements.filter(transfer => transfer.disburseStatus == transferCylinder_1.TransferStatus.PENDING);
                return Promise.resolve({
                    disburse: disbursements,
                    count: {
                        totalApproved: totalApproved.length | 0,
                        totalPending: totalPending.length,
                        totalDisbursements: disbursements.length
                    }
                });
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
}
exports.default = Product;
//# sourceMappingURL=index.js.map