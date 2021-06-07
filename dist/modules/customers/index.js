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
const mail_1 = require("../../util/mail");
const static_1 = require("../../configs/static");
const logs_1 = require("../../util/logs");
class Customer extends module_1.default {
    constructor(props) {
        super();
        this.customer = props.customer;
        this.order = props.order;
        this.complaint = props.complaint;
        this.user = props.user;
        this.walkin = props.walkin;
    }
    createCustomer(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const date = new Date();
                date.setDate(date.getDate() + data.cylinderHoldingTime);
                const customer = yield this.customer.create(Object.assign(Object.assign({}, data), { cylinderHoldingTime: date.toISOString(), branch: user.branch }));
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Customers',
                        //@ts-ignore
                        activity: `You added ${customer.name} to the customer list`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomers(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customers = yield this.customer.find(Object.assign(Object.assign({}, query), { branch: user.branch }));
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
                const customer = yield this.customer.findById(id).populate({
                    path: 'vehicle', model: 'vehicle', populate: {
                        path: 'assignedTo', model: 'User'
                    }
                });
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
                const order = new this.order(Object.assign(Object.assign({}, data), { branch: user.branch }));
                order.tracking.push({
                    location: user.role,
                    status: 'pending'
                });
                yield order.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Order',
                        //@ts-ignore
                        activity: `You created a new order`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    assignOrderToVehicle(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.order.findByIdAndUpdate(data.orderId, { $set: data }, { new: true }).populate({
                    path: 'vehicle', model: 'vehicle', populate: {
                        path: 'assignedTo', model: 'User'
                    }
                });
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchOrdersAssignedToVehicle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield this.order.find({ vehicle: data.vehicle }).populate([
                    {
                        path: 'vehicle', model: 'vehicle', populate: {
                            path: 'assignedTo', model: 'User'
                        }
                    },
                    {
                        path: 'supplier', model: 'supplier'
                    },
                    {
                        path: 'customer', model: 'customer'
                    }
                ]);
                let customerOrder = orders.filter(order => order.pickupType == order_1.pickupType.CUSTOMER && order.status == order_1.PickupStatus.PENDING);
                let supplierOrder = orders.filter(order => order.pickupType == order_1.pickupType.SUPPLIER && order.status == order_1.PickupStatus.PENDING);
                let completed = orders.filter(order => order.status == order_1.PickupStatus.DONE);
                return Promise.resolve({
                    supplier: supplierOrder,
                    customer: customerOrder,
                    completed
                });
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
    fetchAllOrders(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield this.order.find({ branch: user.branch }).populate([
                    { path: 'vehicle', model: 'vehicle' },
                    { path: 'supplier', model: 'supplier' },
                    { path: 'customer', model: 'customer' },
                    { path: 'gasType', model: 'cylinder' }
                ]);
                let customerOrders = orders.filter(order => order.pickupType == order_1.pickupType.CUSTOMER);
                let supplierOrders = orders.filter(order => order.pickupType == order_1.pickupType.SUPPLIER);
                let completedOrders = orders.filter(order => order.status == order_1.PickupStatus.DONE);
                return Promise.resolve({
                    customerOrders,
                    supplierOrders,
                    completedOrders
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markOrderAsDone(data, user) {
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
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Order',
                        //@ts-ignore
                        activity: `You completed this order`,
                        time: new Date().toISOString()
                    }
                });
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
    deletePickupOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.order.findById(orderId);
                if (!order) {
                    throw new exceptions_1.BadInputFormatException('this order may have been deleted');
                }
                yield order.remove();
                return Promise.resolve({
                    message: 'pickup order deleted'
                });
            }
            catch (e) {
            }
        });
    }
    makeComplaint(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // console.log(data);
                const complaint = new this.complaint(Object.assign(Object.assign({}, data), { branch: user.branch }));
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
                }
                yield complaint.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Complaint',
                        //@ts-ignore
                        activity: `You created a complaint for a customer`,
                        time: new Date().toISOString()
                    }
                });
                new mail_1.default().push({
                    subject: "Complaint",
                    content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
                    user: hod
                });
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
                // console.log(data)
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                const complaint = yield this.complaint.findById(data.id).populate('customer');
                if (!complaint) {
                    throw new exceptions_1.BadInputFormatException('complaint not found');
                }
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
                            yield logs_1.createLog({
                                user: user._id,
                                activities: {
                                    title: 'Complaint',
                                    //@ts-ignore
                                    activity: `You Rejected a complaint approval for ${complaint.customer.name}`,
                                    time: new Date().toISOString()
                                }
                            });
                            let approvalUser = yield this.user.findById(AO[0].id);
                            new mail_1.default().push({
                                subject: "Complaint",
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
                                user: approvalUser
                            });
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
                            yield logs_1.createLog({
                                user: user._id,
                                activities: {
                                    title: 'Complaint',
                                    //@ts-ignore
                                    activity: `You Rejected a complaint approval for ${complaint.customer.name}`,
                                    time: new Date().toISOString()
                                }
                            });
                            let approvalUser = yield this.user.findById(AO[0].id);
                            new mail_1.default().push({
                                subject: "Complaint",
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
                                user: approvalUser
                            });
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
                            yield logs_1.createLog({
                                user: user._id,
                                activities: {
                                    title: 'Complaint',
                                    //@ts-ignore
                                    activity: `You Approved a complaint approval for ${complaint.customer.name}`,
                                    time: new Date().toISOString()
                                }
                            });
                            new mail_1.default().push({
                                subject: "Complaint",
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
                                user: hod
                            });
                            return Promise.resolve(complaint);
                        }
                        else if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                            // let track = {
                            //   title:"Initiate complaint",
                            //   stage:stagesOfApproval.STAGE2,
                            //   status:ApprovalStatus.APPROVED,
                            //   dateApproved:new Date().toISOString(),
                            //   approvalOfficer:user._id,
                            //   //@ts-ignore
                            //   nextApprovalOfficer:hod?.branch.branchAdmin
                            // }
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
                            yield logs_1.createLog({
                                user: user._id,
                                activities: {
                                    title: 'Complaint',
                                    //@ts-ignore
                                    activity: `You Approved a complaint approval for ${complaint.customer.name}`,
                                    time: new Date().toISOString()
                                }
                            });
                            let approvalUser = yield this.user.findById(complaint.nextApprovalOfficer);
                            new mail_1.default().push({
                                subject: "Complaint",
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
                                user: approvalUser
                            });
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
                            yield logs_1.createLog({
                                user: user._id,
                                activities: {
                                    title: 'Complaint',
                                    //@ts-ignore
                                    activity: `You Approved a complaint approval for ${complaint.customer.name}`,
                                    time: new Date().toISOString()
                                }
                            });
                            let approvalUser = yield this.user.findById(complaint.initiator);
                            new mail_1.default().push({
                                subject: "Complaint",
                                content: `Complaint approval complete. click to view ${static_1.default.FRONTEND_URL}/fetch-complaints/${complaint._id}`,
                                user: approvalUser
                            });
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
    fetchApprovedComplaints(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaints = yield this.complaint.find(Object.assign(Object.assign({}, query), { branch: user.branch }));
                let approved = complaints.filter(complaint => complaint.approvalStatus == transferCylinder_1.TransferStatus.COMPLETED);
                return Promise.resolve(approved);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    resolveComplaint(complaintId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaint = yield this.complaint.findById(complaintId).populate('customer');
                if (!complaint) {
                    throw new exceptions_1.BadInputFormatException('complaint not found');
                }
                complaint.status = complaint_1.complaintStatus.RESOLVED;
                yield complaint.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Complaint',
                        //@ts-ignore
                        activity: `You resolved a complaint for ${complaint.customer.name}`,
                        time: new Date().toISOString()
                    }
                });
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
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Walk in customer',
                        //@ts-ignore
                        activity: `You registered ${customer.name} as a walk in customer`,
                        time: new Date().toISOString()
                    }
                });
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
    deleteWalkinCustomer(customerId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.walkin.findById(customerId);
                if (!customer) {
                    throw new exceptions_1.BadInputFormatException('customer not found');
                }
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Walk in customer',
                        //@ts-ignore
                        activity: `You Removed ${customer.name}`,
                        time: new Date().toISOString()
                    }
                });
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
    fetchFilledCustomerCylinders(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cylinders = yield this.walkin.find(Object.assign(Object.assign({}, query), { status: walk_in_customers_1.WalkinCustomerStatus.FILLED, branch: user.branch }));
                return cylinders;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Customer;
//# sourceMappingURL=index.js.map