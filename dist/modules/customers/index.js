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
const cylinder_1 = require("../cylinder");
const module_1 = require("../module");
const mail_1 = require("../../util/mail");
const static_1 = require("../../configs/static");
const logs_1 = require("../../util/logs");
const token_1 = require("../../util/token");
class Customer extends module_1.default {
    constructor(props) {
        super();
        this.customer = props.customer;
        this.order = props.order;
        this.complaint = props.complaint;
        this.user = props.user;
        this.walkin = props.walkin;
        this.branch = props.branch;
        this.product = props.product;
        this.vehicle = props.vehicle;
        this.supplier = props.supplier;
        this.cylinder = props.cylinder;
        this.deleteCustomer = props.deleteCustomer;
        this.pickup = props.pickup;
    }
    createCustomer(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (data.cylinderHoldingTime) {
                    const date = new Date();
                    date.setDate(date.getDate() + data.cylinderHoldingTime);
                    //@ts-ignore
                    data.cylinderHoldingTime = date.toISOString();
                }
                // let exist = await this.customer.findOne({email:data.email, branch:user.branch});
                // // console.log(exist)
                // if(exist) {
                //   throw new BadInputFormatException('a customer with this email exists');
                // }
                let cid;
                let customers = yield this.customer.find({}).sort({ gen_id_no: -1 }).limit(1);
                if (!customers[0]) {
                    cid = 1;
                }
                else {
                    cid = customers[0].gen_id_no + 1;
                }
                let gen_id = token_1.padLeft(cid, 6, '');
                let ucid = 'CUS/' + gen_id;
                let products = JSON.parse(data.products);
                const customer = yield this.customer.create(Object.assign(Object.assign({}, data), { products, branch: user.branch, unique_id: ucid }));
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
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'branch', model: 'branches' },
                        { path: 'products', model: 'products' }
                    ], sort: { createdAt: -1 } });
                let q = {
                    branch: user.branch
                };
                let or = [];
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, name, email, phone } = query;
                if (name) {
                    //@ts-ignore
                    or.push({ name: new RegExp(name, 'gi') });
                }
                if (email) {
                    //@ts-ignore
                    or.push({ email: new RegExp(email, 'gi') });
                }
                if (phone) {
                    //@ts-ignore
                    or.push({ phoneNumber: new RegExp(phone, 'gi') });
                }
                if (search) {
                    or.push({ nickName: new RegExp(search, 'gi') });
                    or.push({ customerType: new RegExp(search, 'gi') });
                    or.push({ address: new RegExp(search, 'gi') });
                    or.push({ TIN: new RegExp(search, 'gi') });
                    or.push({ rcNumber: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const customers = yield this.customer.paginate(q, options);
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
                const customer = yield this.customer.findById(id).populate([
                    { path: 'branch', model: 'branches' },
                    { path: 'products', model: 'products' }
                ]);
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteACustomer(customerId, user, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let customer = yield this.customer.findById(customerId);
                if (!customer) {
                    throw new exceptions_1.BadInputFormatException('not found');
                }
                yield this.deleteCustomer.create({
                    name: customer.name,
                    email: customer.email,
                    branch: user.branch,
                    reason,
                    type: customer.customerType
                });
                yield customer.remove();
                return Promise.resolve({
                    message: 'customer deleted'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDeletedCustomers(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, name, email } = query;
                let options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    sort: { createdAt: -1 }
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (name) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { name: name });
                }
                if (email) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { email: email });
                }
                if (search) {
                    or.push({ reason: new RegExp(search, 'gi') });
                }
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                //@ts-ignore
                const customers = yield this.deleteCustomer.paginate(q, options);
                return Promise.resolve(customers);
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
                let findOrder = yield this.order.find({}).sort({ initOn: -1 }).limit(1);
                let initNum;
                if (findOrder[0] == undefined) {
                    initNum = 1;
                }
                else {
                    initNum = findOrder[0].initOn + 1;
                }
                let init = "GRN";
                let ecr = "ECR";
                let icn = "ICN";
                // let str = ""+initNum
                // let pad = "000000"
                // let ans = pad.substring(0, pad.length - str.length) + str;
                const orderNumber = token_1.padLeft(initNum, 6, "");
                order.ecrNo = ecr + orderNumber;
                order.icnNo = icn + orderNumber;
                let grnNo = init + orderNumber;
                order.orderNumber = orderNumber;
                order.initOn = initNum;
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
                const options = {
                    page: query.page,
                    limit: query.limit,
                    populate: [
                        { path: 'vehicle', model: 'vehicle', populate: {
                                path: 'assignedTo', model: 'User'
                            }
                        },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'customer', model: 'customer' }
                    ],
                    sort: { createdAt: -1 }
                };
                const { search, filter } = query;
                let or = [];
                let q = {
                    vehicle: data.vehicle
                };
                if (filter) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { pickupType: filter });
                }
                if (search) {
                    or.push({ status: new RegExp(search, 'gi') });
                    or.push({ orderNumber: new RegExp(search, 'gi') }),
                        or.push({ ecrNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const orders = yield this.order.paginate(q, options);
                return Promise.resolve({
                    orders
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
                        { path: 'vehicle', model: 'vehicle', populate: {
                                path: 'assignedTo', model: 'User'
                            } }
                    ], sort: { createdAt: -1 } });
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
                let options = {
                    page: query.page,
                    limit: query.limit,
                    populate: [
                        { path: 'vehicle', model: 'vehicle', populate: {
                                path: 'assignedTo', model: 'User'
                            } },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'customer', model: 'customer' },
                        { path: 'gasType', model: 'cylinder' }
                    ],
                    sort: { createdAt: -1 }
                };
                const { search, filter, type } = query;
                let or = [];
                let q = {
                    branch: user.branch
                };
                if (filter) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { pickupType: filter });
                }
                if (type) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { orderType: type });
                }
                if (search) {
                    or.push({ status: new RegExp(search, 'gi') });
                    or.push({ orderNumber: new RegExp(search, 'gi') }),
                        or.push({ ecrNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const orders = yield this.order.paginate(q, options);
                return Promise.resolve({
                    orders
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
                const order = yield this.order.findById(orderId).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'vehicle', model: 'vehicle', populate: {
                            path: 'assignedTo', model: 'User'
                        } }
                ]);
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
                    content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
                yield token_1.passWdCheck(user, data.password);
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
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
                                user: hod
                            });
                            return Promise.resolve(complaint);
                        }
                        else if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
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
                            let branchAdmin = yield this.user.findOne({ branch: hod === null || hod === void 0 ? void 0 : hod.branch, subrole: "superadmin" });
                            // console.log(branchAdmin)
                            complaint.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
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
                                content: `A complaint requires your attention click to view ${static_1.default.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
                                user: approvalUser
                            });
                            return Promise.resolve(complaint);
                        }
                        else if ((complaint === null || complaint === void 0 ? void 0 : complaint.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
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
                                content: `Complaint approval complete. click to view ${static_1.default.FRONTEND_URL}/customer/fetch-complaints/${complaint._id}`,
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter } = query;
                const options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: 'branch', model: 'branches' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'customer', model: 'customer' },
                        { path: "icn", model: "out-going-cylinders" },
                        { path: "ecr", model: "empty-cylinders" }
                    ],
                    sort: { createdAt: -1 }
                };
                // console.log(user);
                let q = {
                    branch: user.branch,
                    approvalStatus: transferCylinder_1.TransferStatus.PENDING,
                    nextApprovalOfficer: user._id
                };
                let or = [];
                if (search) {
                    or.push({ customerName: new RegExp(search, 'gi') });
                    or.push({ issue: new RegExp(search, 'gi') });
                    or.push({ deliveryNo: new RegExp(search, 'gi') });
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                    or.push({ icnNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const complaints = yield this.complaint.paginate(q, options);
                return Promise.resolve(complaints);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchComplaints(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, customer, complaintStatus, fromDate, toDate, supplyDate } = query;
                // console.log(customerId);
                const options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: 'branch', model: 'branches' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'customer', model: 'customer' },
                        { path: "icn", model: "out-going-cylinders" },
                        { path: "ecr", model: "empty-cylinders" }
                    ],
                    sort: { createdAt: -1 }
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ title: new RegExp(search, 'gi') });
                    or.push({ issue: new RegExp(search, 'gi') });
                    or.push({ deliveryNo: new RegExp(search, 'gi') });
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                    or.push({ icnNo: new RegExp(search, 'gi') });
                }
                if (filter) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { approvalStatus: filter });
                }
                if (complaintStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { status: complaintStatus });
                }
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
                if (supplyDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { supplyDate: { $eq: new Date(supplyDate) } });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const complains = yield this.complaint.paginate(q, options);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, supplyDate } = query;
                const options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: 'branch', model: 'branches' },
                        { path: 'initiator', model: 'User' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'customer', model: 'customer' },
                        { path: "icn", model: "out-going-cylinders" },
                        { path: "ecr", model: "empty-cylinders" }
                    ],
                    sort: { createdAt: -1 }
                };
                let q = {
                    branch: user._id
                };
                let or = [];
                if (search) {
                    or.push({ title: new RegExp(search, 'gi') });
                    or.push({ issue: new RegExp(search, 'gi') });
                    or.push({ deliveryNo: new RegExp(search, 'gi') });
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                    or.push({ icnNo: new RegExp(search, 'gi') });
                }
                if (filter === null || filter === void 0 ? void 0 : filter.length) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { approvalStatus: filter });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                if (supplyDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { supplyDate: { $eq: new Date(supplyDate) } });
                }
                //@ts-ignore
                const complaints = yield this.complaint.paginate(q, options);
                //populate id reference fields
                for (let comp of complaints.docs) {
                    let branch = yield this.branch.findById(comp.branch);
                    comp.branch = branch;
                    let initiator = yield this.user.findById(comp.initiator);
                    comp.initiator = initiator;
                    let nextApprovalOfficer = yield this.user.findById(comp.nextApprovalOfficer);
                    comp.nextApprovalOfficer = nextApprovalOfficer;
                    let customer = yield this.customer.findById(comp.customer);
                    comp.customer = customer;
                }
                return Promise.resolve(complaints);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    complaintsDetails(complaintId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const complaint = yield this.complaint.findById(complaintId).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'branch', model: 'branches' },
                    { path: "icn", model: "out-going-cylinders" },
                    { path: "ecr", model: "empty-cylinders" }
                ]);
                return Promise.resolve(complaint);
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
                    { path: 'customer', model: 'customer' },
                    { path: 'initiator', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'branch', model: 'branches' },
                    { path: "icn", model: "out-going-cylinders" },
                    { path: "ecr", model: "empty-cylinders" }
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
                const findCustomers = yield this.walkin.find().sort({ serialNo: -1 }).limit(1);
                // let docs = findCustomers.map(doc=>doc.serialNo);
                // let maxNumber = Math.max(...docs);
                // let sn = maxNumber + 1
                // customer.serialNo = sn | 1;
                if (findCustomers[0]) {
                    customer.serialNo = findCustomers[0].serialNo + 1;
                }
                else {
                    customer.serialNo = 1;
                }
                let init = "ECR";
                let num = token_1.padLeft(customer.serialNo, 6, "");
                //@ts-ignore
                customer.ecrNo = init + num;
                let icnInit = "ICN";
                // let icn = await generateToken(6);
                //@ts-ignore
                customer.icnNo = icnInit + num;
                customer.security = user._id;
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'branch', model: 'branches' }
                    ], sort: { createdAt: -1 } });
                let aggregate;
                const aggregate1 = this.walkin.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { customerName: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { status: filter === null || filter === void 0 ? void 0 : filter.toLowerCase() },
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    }
                ]);
                const aggregate2 = this.walkin.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { customerName: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    }
                ]);
                if ((search === null || search === void 0 ? void 0 : search.length) && (filter === null || filter === void 0 ? void 0 : filter.length)) {
                    aggregate = aggregate1;
                }
                else if ((search === null || search === void 0 ? void 0 : search.length) && !(filter === null || filter === void 0 ? void 0 : filter.length)) {
                    aggregate2;
                }
                //@ts-ignore
                const customers = yield this.walkin.aggregatePaginate(aggregate, options);
                //populate id reference fields
                for (let cust of customers.docs) {
                    let branch = yield this.branch.findById(cust.branch);
                    cust.branch = branch;
                    let security = yield this.user.findById(cust.security);
                    cust.security = security;
                    let recievedBy = yield this.user.findById(cust.recievedBy);
                    cust.recievedBy = recievedBy;
                }
                return Promise.resolve(customers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchWalkinCustomer(icnNo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.walkin.findOne({ icnNo }).populate([
                    { path: 'branch', model: 'branches' },
                    { path: 'recievedBy', model: 'User' },
                    { path: 'security', model: 'User' }
                ]);
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateWalkinCustomer(customerId, data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.walkin.findById(customerId).populate([
                    { path: 'branch', model: 'branches' },
                    { path: 'recievedBy', model: 'User' },
                    { path: 'security', model: 'User' }
                ]);
                if (!customer) {
                    throw new exceptions_1.BadInputFormatException('this customer was not registered.. contact security!!!');
                }
                let updatedCustomer = yield this.walkin.findByIdAndUpdate(customer._id, Object.assign(Object.assign({}, data), { recievedBy: user._id }), { new: true });
                return Promise.resolve(updatedCustomer);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'branch', model: 'branches' }
                    ] });
                let aggregate;
                const aggregate1 = this.walkin.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { customerName: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { status: filter === null || filter === void 0 ? void 0 : filter.toLowerCase() },
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    }
                ]);
                const aggregate2 = this.walkin.aggregate([
                    {
                        $match: {
                            $and: [
                                { $or: [
                                        { customerName: {
                                                $regex: (search === null || search === void 0 ? void 0 : search.toLowerCase()) || ''
                                            } }
                                    ] },
                                { branch: ObjectId(user.branch.toString()) }
                            ]
                        }
                    }
                ]);
                if ((search === null || search === void 0 ? void 0 : search.length) && (filter === null || filter === void 0 ? void 0 : filter.length)) {
                    aggregate = aggregate1;
                }
                else if ((search === null || search === void 0 ? void 0 : search.length) && !(filter === null || filter === void 0 ? void 0 : filter.length)) {
                    aggregate2;
                }
                //@ts-ignore
                const cylinders = yield this.walkin.aggregatePaginate(aggregate, options);
                for (let cyl of cylinders.docs) {
                    let branch = yield this.cylinder.findById(cyl.branch);
                    cyl.branch = branch;
                }
                return cylinders;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    customerOrderHistory(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { search, customer_unique_id, activity } = query;
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ tecrNo: new RegExp(search, 'gi') });
                }
                if (customer_unique_id) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { "customers.unique_id": customer_unique_id });
                }
                if (activity) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { activity: activity });
                }
                let orders = yield this.pickup.find(q);
                if (orders.length <= 0) {
                    throw new exceptions_1.BadInputFormatException('no order matches the parameters');
                }
                //@ts-ignore
                let mappedCustomer = orders.map(doc => {
                    return doc.customers;
                });
                //@ts-ignore
                let customerOrder = [];
                for (let ar of mappedCustomer) {
                    for (let a of ar) {
                        if (a.unique_id == customer_unique_id) {
                            customerOrder.push(a);
                        }
                    }
                }
                return Promise.resolve(customerOrder);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Customer;
//# sourceMappingURL=index.js.map