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
const complaint_1 = require("../../models/complaint");
const order_1 = require("../../models/order");
const transferCylinder_1 = require("../../models/transferCylinder");
const walk_in_customers_1 = require("../../models/walk-in-customers");
const module_1 = require("../module");
const bcryptjs_1 = require("bcryptjs");
class Customer extends module_1.default {
    constructor(props) {
        super();
        this.customer = props.customer;
        this.order = props.order;
        this.complaint = props.complaint;
        this.user = props.user;
        this.walkin = props.walkin;
    }
    createCustomer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const date = new Date();
                date.setDate(date.getDate() + data.cylinderHoldingTime);
                const customer = yield this.customer.create(Object.assign(Object.assign({}, data), { cylinderHoldingTime: date.toISOString() }));
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customers = yield this.customer.find(query);
                return Promise.resolve(customers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomerDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.customer.findById(id);
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    createOrder(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = new this.order(data);
                order.tracking.push({
                    location: user.role,
                    status: 'pending'
                });
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomerOrder(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const orders = yield this.order.find({ customer: `${customerId}` }).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'vehicle', model: 'vehicle' }
                ]);
                return Promise.resolve(orders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markOrderAsDone(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.order.findById(data.orderId);
                if (data.status == order_1.PickupStatus.DONE) {
                    //@ts-ignore
                    order === null || order === void 0 ? void 0 : order.status = order_1.PickupStatus.DONE;
                }
                else if (data.status == order_1.PickupStatus.PENDING) {
                    //@ts-ignore
                    order === null || order === void 0 ? void 0 : order.status = order_1.PickupStatus.PENDING;
                }
                yield (order === null || order === void 0 ? void 0 : order.save());
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateTracking(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.order.findById(data.orderId);
                //@ts-ignore
                order === null || order === void 0 ? void 0 : order.status = data.status;
                //@ts-ignore
                order.location = data.location;
                //@ts-ignore
                yield order.save();
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    viewOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.order.findById(orderId);
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    makeComplaint(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaint = new this.complaint(data);
                const hod = yield this.user.findOne({ branch: user.branch, role: user.role, subrole: 'head of department' });
                if (complaint.complaintType == 'cylinder') {
                    complaint.initiator = user._id;
                    complaint.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                    complaint.approvalStatus = transferCylinder_1.TransferStatus.PENDING;
                    complaint.status = complaint_1.complaintStatus.PENDING;
                    complaint.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                    complaint.approvalOfficers.push({
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
                    complaint.comments.push(com);
                    complaint.save();
                }
                yield complaint.save();
                return Promise.resolve(complaint);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveComplaint(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let matchPWD = bcryptjs_1.compareSync(data.password, user.password);
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                const complaint = yield this.complaint.findById(data.id);
                if ((complaint === null || complaint === void 0 ? void 0 : complaint.complaintType) == 'cylinder') {
                    if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                        if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                            let AO = complaint.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                            let track = {
                                title: "Approval Process",
                                stage: transferCylinder_1.stagesOfApproval.STAGE2,
                                status: transferCylinder_1.ApprovalStatus.REJECTED,
                                dateApproved: new Date().toISOString(),
                                approvalOfficer: user._id,
                                nextApprovalOfficer: AO[0].id
                            };
                            let checkOfficer = complaint.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                            if (checkOfficer.length == 0) {
                                complaint.approvalOfficers.push({
                                    name: user.name,
                                    id: user._id,
                                    office: user.subrole,
                                    department: user.role,
                                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                                });
                            }
                            //@ts-ignore
                            complaint.tracking.push(track);
                            complaint.approvalStage = transferCylinder_1.stagesOfApproval.START;
                            complaint.nextApprovalOfficer = AO[0].id;
                            complaint.comments.push({
                                comment: data.comment,
                                commentBy: user._id
                            });
                            yield complaint.save();
                            return Promise.resolve(complaint);
                        }
                        else if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                            let AO = complaint.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                            let track = {
                                title: "Approval Process",
                                stage: transferCylinder_1.stagesOfApproval.STAGE3,
                                status: transferCylinder_1.ApprovalStatus.REJECTED,
                                dateApproved: new Date().toISOString(),
                                approvalOfficer: user._id,
                                nextApprovalOfficer: AO[0].id
                            };
                            let checkOfficer = complaint.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                            if (checkOfficer.length == 0) {
                                complaint.approvalOfficers.push({
                                    name: user.name,
                                    id: user._id,
                                    office: user.subrole,
                                    department: user.role,
                                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                                });
                            }
                            //@ts-ignore
                            complaint.tracking.push(track);
                            complaint.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                            complaint.nextApprovalOfficer = AO[0].id;
                            complaint.comments.push({
                                comment: data.comment,
                                commentBy: user._id
                            });
                            yield complaint.save();
                            return Promise.resolve(complaint);
                        }
                    }
                    else {
                        let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                            path: 'branch', model: 'branches'
                        });
                        // console.log(hod);
                        if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                            let checkOfficer = complaint.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                            if (checkOfficer.length == 0) {
                                complaint.approvalOfficers.push({
                                    name: user.name,
                                    id: user._id,
                                    office: user.subrole,
                                    department: user.role,
                                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                                });
                            }
                            complaint.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                            //@ts-ignore
                            complaint.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                            complaint.comments.push({
                                comment: data.comment,
                                commentBy: user._id
                            });
                            yield complaint.save();
                            return Promise.resolve(complaint);
                        }
                        else if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                            let track = {
                                title: "Initiate complaint",
                                stage: transferCylinder_1.stagesOfApproval.STAGE2,
                                status: transferCylinder_1.ApprovalStatus.APPROVED,
                                dateApproved: new Date().toISOString(),
                                approvalOfficer: user._id,
                                //@ts-ignore
                                nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin
                            };
                            // console.log(track);
                            let checkOfficer = complaint.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                            if (checkOfficer.length == 0) {
                                complaint.approvalOfficers.push({
                                    name: user.name,
                                    id: user._id,
                                    office: user.subrole,
                                    department: user.role,
                                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                                });
                            }
                            complaint.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                            //@ts-ignore
                            complaint.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
                            complaint.comments.push({
                                comment: data.comment,
                                commentBy: user._id
                            });
                            yield complaint.save();
                            return Promise.resolve(complaint);
                        }
                        else if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                            // let track = {
                            //   title:"Initiate complaint",
                            //   stage:stagesOfApproval.STAGE3,
                            //   status:ApprovalStatus.APPROVED,
                            //   dateApproved:new Date().toISOString(),
                            //   approvalOfficer:user._id,
                            //   // nextApprovalOfficer:data.nextApprovalOfficer
                            // }
                            let checkOfficer = complaint.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                            if (checkOfficer.length == 0) {
                                complaint.approvalOfficers.push({
                                    name: user.name,
                                    id: user._id,
                                    office: user.subrole,
                                    department: user.role,
                                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                                });
                            }
                            //@ts-ignore
                            // complaint.tracking.push(track)
                            complaint.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                            complaint.approvalStatus = transferCylinder_1.TransferStatus.COMPLETED;
                            //@ts-ignore
                            // complaint.nextApprovalOfficer = data.nextApprovalOfficer
                            complaint.comments.push({
                                comment: data.comment,
                                commentBy: user._id
                            });
                            yield complaint.save();
                            return Promise.resolve(complaint);
                        }
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchUserComplaintApproval(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaints = yield this.complaint.find(query);
                let pendingComplaints = complaints.filter(complaint => complaint.approvalStatus == transferCylinder_1.TransferStatus.PENDING && complaint.branch == user.branch);
                let startStage = pendingComplaints.filter(transfer => {
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
                let stage1 = pendingComplaints.filter(transfer => {
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
                let stage2 = pendingComplaints.filter(transfer => {
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
    fetchComplaints(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const complains = yield this.complaint.find({ customer: customerId });
                return Promise.resolve(complains);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchApprovedCOmplaints(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaints = yield this.complaint.find(query);
                let approved = complaints.filter(complaint => complaint.approvalStatus == transferCylinder_1.TransferStatus.COMPLETED);
                return Promise.resolve(approved);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    resolveComplaint(complaintId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaint = yield this.complaint.findById(complaintId);
                if (!complaint) {
                    throw new exceptions_1.BadInputFormatException('complaint not found');
                }
                complaint.status = complaint_1.complaintStatus.RESOLVED;
                return Promise.resolve(complaint);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    registerWalkinCustomers(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = new this.walkin(Object.assign(Object.assign({}, data), { branch: user.branch }));
                const findCustomers = yield this.walkin.find();
                let docs = findCustomers.map(doc => doc.serialNo);
                let maxNumber = Math.max(...docs);
                let sn = maxNumber + 1;
                customer.serialNo = sn | 1;
                yield customer.save();
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchWalkinCustomers(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customers = yield this.walkin.find(Object.assign(Object.assign({}, query), { branch: user.branch }));
                return Promise.resolve(customers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchWalkinCustomer(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.walkin.findById(customerId);
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteWalkinCustomer(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.walkin.findById(customerId);
                if (!customer) {
                    throw new exceptions_1.BadInputFormatException('customer not found');
                }
                yield customer.remove();
                return Promise.resolve({
                    message: 'Done'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markFilledCustomer(cylinderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.walkin.findById(cylinderId);
                if (!customer) {
                    throw new exceptions_1.BadInputFormatException('customer not found');
                }
                customer.status = walk_in_customers_1.WalkinCustomerStatus.FILLED;
                yield customer.save();
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Customer;
//# sourceMappingURL=index.js.map