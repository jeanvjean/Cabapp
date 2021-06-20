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
class PurchaseOrder extends module_1.default {
    constructor(props) {
        super();
        this.purchase = props.purchase;
        this.user = props.user;
    }
    createPurchaseOrder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const purchase = new this.purchase(data);
                purchase.branch = user.branch;
                purchase.initiator = user._id;
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
                    { path: 'nextApprovalOfficer', model: 'User' }
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
                //@ts-ignore
                const purchases = yield this.purchase.paginate({ branch: user.branch }, Object.assign({}, query));
                //@ts-ignore
                const approved = yield this.purchase.paginate({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.COMPLETED }, Object.assign({}, query));
                //@ts-ignore
                const pending = yield this.purchase.paginate({ branch: user.branch, approvalStatus: transferCylinder_1.TransferStatus.PENDING }, Object.assign({}, query));
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
                        //   let track = {
                        //     title:"Approval Process",
                        //     stage:stagesOfApproval.STAGE2,
                        //     status:ApprovalStatus.REJECTED,
                        //     dateApproved:new Date().toISOString(),
                        //     approvalOfficer:user._id,
                        //     nextApprovalOfficer:AO[0].id
                        //   }
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
                        //   let track = {
                        //     title:"Approval Process",
                        //     stage:stagesOfApproval.STAGE3,
                        //     status:ApprovalStatus.REJECTED,
                        //     dateApproved:new Date().toISOString(),
                        //     approvalOfficer:user._id,
                        //     nextApprovalOfficer:AO[0].id
                        //   }
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
                        //   let track = {
                        //     title:"Approval Prorcess",
                        //     stage:stagesOfApproval.STAGE1,
                        //     status:ApprovalStatus.APPROVED,
                        //     dateApproved:new Date().toISOString(),
                        //     approvalOfficer:user._id,
                        //     nextApprovalOfficer:hod?._id
                        //   }
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
                        //   let track = {
                        //     title:"Initiate Transfer",
                        //     stage:stagesOfApproval.STAGE2,
                        //     status:ApprovalStatus.APPROVED,
                        //     dateApproved:new Date().toISOString(),
                        //     approvalOfficer:user._id,
                        //     //@ts-ignore
                        //     nextApprovalOfficer:hod?.branch.branchAdmin
                        //   }
                        // console.log(track);
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
                        purchase.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        purchase.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
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
                        //   let track = {
                        //     title:"Initiate Transfer",
                        //     stage:stagesOfApproval.STAGE3,
                        //     status:ApprovalStatus.APPROVED,
                        //     dateApproved:new Date().toISOString(),
                        //     approvalOfficer:user._id,
                        //     // nextApprovalOfficer:data.nextApprovalOfficer
                        //   }
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
                //@ts-ignore
                const purchaseOrders = yield this.purchase.paginate({
                    branch: user.branch,
                    nextApprovalOfficer: user._id,
                    approvalStatus: transferCylinder_1.TransferStatus.PENDING
                }, Object.assign({}, query));
                // let startStage = purchaseOrders.filter(purchase=> {
                //     if(purchase.approvalStage == stagesOfApproval.START) {
                //       for(let tofficer of purchase.approvalOfficers) {
                //         if(`${tofficer.id}` == `${user._id}`){
                //           if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                //             return purchase
                //           }
                //         }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
                //           return purchase
                //         }
                //       }
                //     }
                //   });
                //   let stage1 = purchaseOrders.filter(purchase=>{
                //     if(purchase.approvalStage == stagesOfApproval.STAGE1) {
                //       for(let tofficer of purchase.approvalOfficers) {
                //         if(`${tofficer.id}` == `${user._id}`){
                //           if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                //             return purchase
                //           }
                //         }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
                //           return purchase
                //         }
                //       }
                //     }
                //   });
                // let stage2 = purchaseOrders.filter(purchase=>{
                //   if(purchase.approvalStage == stagesOfApproval.STAGE2) {
                //     for(let tofficer of purchase.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                //           return purchase
                //         }
                //       }else if(`${purchase.nextApprovalOfficer}` == `${user._id}`){
                //         return purchase
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