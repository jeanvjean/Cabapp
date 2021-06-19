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
                //@ts-ignore
                const customers = yield this.customer.paginate({ branch: user.branch }, Object.assign({}, query));
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
    fetchAllCustomers(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customers = yield this.customer.find({ branch: user.branch });
                return Promise.resolve(customers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchOrdersAssignedToVehicle(query, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'vehicle', model: 'vehicle', populate: {
                                path: 'assignedTo', model: 'User'
                            }
                        },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'customer', model: 'customer' }
                    ] });
                //@ts-ignore
                const orders = yield this.order.paginate({ vehicle: data.vehicle }, options);
                //@ts-ignore
                let customerOrder = yield this.order.paginate({ vehicle: data.vehicle, status: order_1.PickupStatus.PENDING, pickupType: order_1.pickupType.CUSTOMER }, options);
                //@ts-ignore
                let supplierOrder = yield this.order.paginate({ vehicle: data.vehicle, status: order_1.PickupStatus.PENDING, pickupType: order_1.pickupType.SUPPLIER }, options);
                //@ts-ignore
                let completed = yield this.order.paginate({ vehicle: data.vehicle, status: order_1.PickupStatus.DONE }, options);
                //@ts-ignore
                let completedCustomerOrders = yield this.order.paginate({ vehicle: data.vehicle, status: order_1.PickupStatus.DONE, pickupType: order_1.pickupType.CUSTOMER }, options);
                //@ts-ignore
                let completedSupplierOrders = yield this.order.paginate({ vehicle: data.vehicle, status: order_1.PickupStatus.DONE, pickupType: order_1.pickupType.SUPPLIER }, options);
                return Promise.resolve({
                    supplier: supplierOrder,
                    customer: customerOrder,
                    completed: {
                        customers: completedCustomerOrders,
                        suppliers: completedSupplierOrders
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomerOrder(query, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'vehicle', model: 'vehicle' }
                    ] });
                //@ts-ignore
                const orders = yield this.order.paginate({ customer: `${customerId}` }, options);
                return Promise.resolve(orders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchAllOrders(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'vehicle', model: 'vehicle' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'customer', model: 'customer' },
                        { path: 'gasType', model: 'cylinder' }
                    ] });
                console.log(options);
                //@ts-ignore
                const orders = yield this.order.paginate({ branch: user.branch }, options);
                //@ts-ignore
                let customerOrders = yield this.order.paginate({ branch: user.branch, pickupType: order_1.pickupType.CUSTOMER }, options);
                console.log(customerOrders);
                //@ts-ignore
                let supplierOrders = yield this.order.paginate({ branch: user.branch, pickupType: order_1.pickupType.SUPPLIER }, options);
                //@ts-ignore
                let completedOrders = yield this.order.paginate({ branch: user.branch, status: order_1.PickupStatus.DONE }, options);
                //@ts-ignore
                let completedCustomerOrders = yield this.order.paginate({
                    branch: user.branch,
                    pickupType: order_1.pickupType.CUSTOMER,
                    status: order_1.PickupStatus.DONE
                }, options);
                //@ts-ignore
                let completedSupplierOrders = yield this.order.paginate({
                    branch: user.branch,
                    pickupType: order_1.pickupType.SUPPLIER,
                    status: order_1.PickupStatus.DONE
                }, options);
                return Promise.resolve({
                    customerOrders,
                    supplierOrders,
                    completedOrders: {
                        customers: completedCustomerOrders,
                        suppliers: completedSupplierOrders
                    }
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
                const complaint = yield this.complaint.findById(data.id).populate([
                    { path: 'customer', ref: 'User' }
                ]);
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
                //@ts-ignore
                const complaints = yield this.complaint.paginate({
                    branch: user.branch,
                    approvalStatus: transferCylinder_1.TransferStatus.PENDING,
                    nextApprovalOfficer: user._id
                }, Object.assign({}, query));
                // let startStage = complaints.filter(transfer=> {
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
                // let stage1 = complaints.filter(transfer=>{
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
                // let stage2 = complaints.filter(transfer=>{
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
                return Promise.resolve(complaints);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchComplaints(query, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const complains = yield this.complaint.paginate({ customer: customerId }, Object.assign({}, query));
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
                //@ts-ignore
                const complaints = yield this.complaint.paginate({ branch: user.branch, ApprovalStatus: transferCylinder_1.TransferStatus.COMPLETED }, Object.assign({}, query));
                return Promise.resolve(complaints);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    resolveComplaint(complaintId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaint = yield this.complaint.findById(complaintId).populate([
                    { path: 'customer', model: 'User' }
                ]);
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
                //@ts-ignore
                const customers = yield this.walkin.paginate({ branch: user.branch }, Object.assign({}, query));
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
                //@ts-ignore
                const cylinders = yield this.walkin.paginate({ status: walk_in_customers_1.WalkinCustomerStatus.FILLED, branch: user.branch }, Object.assign({}, query));
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