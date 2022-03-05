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
const emptyCylinder_1 = require("../../models/emptyCylinder");
const walk_in_customers_1 = require("../../models/walk-in-customers");
const logs_1 = require("../../util/logs");
const mail_1 = require("../../util/mail");
const token_1 = require("../../util/token");
const cylinder_1 = require("../cylinder");
const module_1 = require("../module");
const static_1 = require("../../configs/static");
class EmptyCylinderModule extends module_1.default {
    constructor(props) {
        super();
        this.emptyCylinder = props.emptyCylinder;
        this.user = props.user;
        this.ocn = props.ocn;
        this.cylinder = props.cylinder;
        this.customer = props.customer;
        this.branch = props.branch;
    }
    createECR(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let not_same = [];
                const ecr = new this.emptyCylinder(Object.assign(Object.assign({}, data), { branch: user.branch, initiator: user._id }));
                let aprvO = yield this.user.findOne({ role: user.role, subrole: "head of department", branch: user.branch });
                if (!aprvO) {
                    throw new exceptions_1.BadInputFormatException('can\'t find the HOD cannot create without one');
                }
                if (data.customer) {
                    let cust = yield this.customer.findById(data.customer);
                    if (!cust) {
                        throw new exceptions_1.BadInputFormatException('no customer found with this id. pass a valid customer id');
                    }
                }
                ecr.nextApprovalOfficer = aprvO === null || aprvO === void 0 ? void 0 : aprvO._id;
                if (ecr.priority == emptyCylinder_1.Priority.URGENT) {
                    new mail_1.default().push({
                        subject: "Created ECR Priority",
                        content: `An ECR requires your URGENT! approval please check and review for approval ${static_1.default.FRONTEND_URL}/ecr/ecr-details/${ecr._id}`,
                        user: aprvO
                    });
                }
                if (ecr.priority == emptyCylinder_1.Priority.REGULAR) {
                    new mail_1.default().push({
                        subject: "Created ECR",
                        content: `An ECR requires your approval please check and review for approval ${static_1.default.FRONTEND_URL}/ecr/ecr-details/${ecr._id}`,
                        user: aprvO
                    });
                }
                let added = [];
                if (ecr.cylinders.length > 0) {
                    for (let cyl of ecr.cylinders) {
                        let c = yield this.cylinder.findById(cyl);
                        if (c) {
                            if (c.gasType == data.gasType) {
                                //@ts-ignore
                                c.cylinderStatus = walk_in_customers_1.WalkinCustomerStatus.EMPTY;
                                c.assignedTo = data.customer;
                                added.push(cyl);
                                yield c.save();
                            }
                            else {
                                not_same.push({
                                    cyliderNumebr: c.cylinderNumber,
                                    assignedNumber: c.assignedNumber,
                                    barcode: c.barcode
                                });
                            }
                        }
                    }
                }
                ecr.cylinders = added;
                let avEcr = yield this.emptyCylinder.find({}).sort({ initNum: -1 }).limit(1);
                let init = "SECR";
                let num;
                if (!avEcr[0]) {
                    num = 1;
                }
                else {
                    //@ts-ignore
                    num = avEcr[0].initNum + 1;
                }
                let inNum = token_1.padLeft(num, 6, "");
                if (ecr.type == emptyCylinder_1.EcrType.FILLED) {
                    init = 'SFCR';
                }
                ecr.ecrNo = init + inNum;
                ecr.initNum = num;
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'ECR created',
                        activity: `Created an ECR`,
                        time: new Date().toISOString()
                    }
                });
                let message = not_same.length > 0 ? 'ecr created !! some cylinders do not match the gas type' : 'ecr created';
                let fIcn = yield this.ocn.findById(ecr.icn_id);
                if (!fIcn) {
                    throw new exceptions_1.BadInputFormatException('an icn with this id was not found');
                }
                let totalIcnCylinders = fIcn.totalCylinders;
                let ecrtotalcyl = ecr.cylinders.length;
                fIcn.totalCylinders = totalIcnCylinders - +ecrtotalcyl;
                if (fIcn.totalCylinders == 0) {
                    fIcn.closed = true;
                }
                yield fIcn.save();
                yield ecr.save();
                return Promise.resolve({
                    ecr,
                    missed_cyinders: not_same,
                    message
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    emptyCylinderPool(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, type, page, limit } = query;
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    sort: { priority: 1 },
                    populate: [
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: "gasType", model: "cylinder" },
                        { path: "icn_id", model: "out-going-cylinders", populate: [
                                { path: "initiator", model: "User" },
                                { path: "vehicle", model: "vehicle", select: "assignedTo", populate: {
                                        path: 'assignedTo', model: "User"
                                    } }
                            ]
                        }
                    ]
                };
                let q = {
                    branch: user.branch,
                    type: emptyCylinder_1.EcrType.SALES,
                    closed: false
                };
                let or = [];
                if (search) {
                    or.push({ status: new RegExp(search, 'gi') });
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                }
                if (type) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { type: type });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const ecr = yield this.emptyCylinder.paginate(q, options);
                return Promise.resolve(ecr);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    complaintEcr(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, type, page, limit } = query;
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: "gasType", model: "cylinder" },
                        { path: "icn_id", model: "out-going-cylinders" }
                    ],
                    sort: { priority: 1 }
                };
                let q = {
                    branch: user.branch,
                    type: emptyCylinder_1.EcrType.COMPLAINT,
                    closed: false
                };
                let or = [];
                if (search) {
                    or.push({ status: new RegExp(search, 'gi') });
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                }
                if (type) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { type: type });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const ecr = yield this.emptyCylinder.paginate(q, options);
                return Promise.resolve(ecr);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchEcrdetails(ecrId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ecr = yield this.emptyCylinder.findById(ecrId).populate([
                    { path: 'cylinders', model: 'registered-cylinders' },
                    { path: 'customer', model: 'customer' },
                    { path: 'supplier', model: 'supplier' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'initiator', model: 'User' },
                    { path: 'branch', model: 'branches' },
                    { path: "gasType", model: "cylinder" },
                    { path: "icn_id", model: "out-going-cylinders", populate: [
                            { path: "initiator", model: "User" },
                            { path: "vehicle", model: "vehicle", select: "assignedTo", populate: {
                                    path: 'assignedTo', model: "User"
                                } }
                        ]
                    }
                ]);
                return Promise.resolve(ecr);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTECR(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { ecr, customer, type, driverStatus, salesStatus, search } = query;
                let q = {
                    branch: user.branch,
                    type: emptyCylinder_1.EcrType.TRUCK
                };
                let options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'initiator', model: 'User', populate: {
                                path: 'vehicle', model: 'vehicle'
                            }, select: 'name email vehicle' },
                        { path: "gasType", model: "cylinder" },
                        { path: "icn_id", model: "out-going-cylinders", populate: [
                                { path: "initiator", model: "User" },
                                { path: "vehicle", model: "vehicle", select: "assignedTo", populate: {
                                        path: 'assignedTo', model: "User"
                                    } }
                            ]
                        }
                    ],
                    sort: { priority: 1 }
                };
                let or = [];
                if (ecr) {
                    // or.push({tecrNo: new RegExp(tecr, 'gi')})
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { ecrNo: new RegExp(ecr, 'gi') });
                }
                if (customer) {
                    // or.push({"customer.name": new RegExp(customer, 'gi')})
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { "customer.name": new RegExp(customer, 'gi') });
                }
                if (type) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { type: new RegExp(type, 'gi') });
                }
                if (driverStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { driverStatus: new RegExp(driverStatus, 'gi') });
                }
                if (salesStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { status: new RegExp(salesStatus, 'gi') });
                }
                if (search) {
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const empty = yield this.emptyCylinder.paginate(q, options);
                return Promise.resolve(empty);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchFCR(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { ecr, customer, type, driverStatus, salesStatus, search } = query;
                let q = {
                    branch: user.branch,
                    type: emptyCylinder_1.EcrType.FILLED,
                    closed: false
                };
                let options = {
                    page: query.page || 1,
                    limit: query.limit || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'cylinders', model: 'registered-cylinders' },
                        { path: 'nextApprovalOfficer', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'initiator', model: 'User' },
                        { path: "gasType", model: "cylinder" },
                        { path: "icn_id", model: "out-going-cylinders", populate: [
                                { path: "initiator", model: "User" },
                                { path: "vehicle", model: "vehicle", select: "assignedTo", populate: {
                                        path: 'assignedTo', model: "User"
                                    } }
                            ]
                        }
                    ],
                    sort: { priority: 1 }
                };
                let or = [];
                if (ecr) {
                    // or.push({tecrNo: new RegExp(tecr, 'gi')})
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { tecrNo: new RegExp(ecr, 'gi') });
                }
                if (customer) {
                    // or.push({"customer.name": new RegExp(customer, 'gi')})
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { "customer.name": new RegExp(customer, 'gi') });
                }
                if (type) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { type: new RegExp(type, 'gi') });
                }
                if (driverStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { driverStatus: new RegExp(driverStatus, 'gi') });
                }
                if (salesStatus) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { status: new RegExp(salesStatus, 'gi') });
                }
                if (search) {
                    or.push({ tecrNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const empty = yield this.emptyCylinder.paginate(q, options);
                return Promise.resolve(empty);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchTEcrDetails(tecrNo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.emptyCylinder.findOne({ ecrNo: tecrNo }).populate([
                    { path: 'cylinders', model: 'registered-cylinders' },
                    { path: 'customer', model: 'customer' },
                    { path: 'supplier', model: 'supplier' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'initiator', model: 'User', populate: {
                            path: 'vehicle', model: "vehicle"
                        }, select: 'name email vehicle' },
                    { path: 'branch', model: 'branches' },
                    { path: "gasType", model: "cylinder" },
                    { path: "icn_id", model: "out-going-cylinders", populate: [
                            { path: "initiator", model: "User" },
                            { path: "vehicle", model: "vehicle", select: "assignedTo", populate: {
                                    path: 'assignedTo', model: "User"
                                } }
                        ]
                    }
                ]);
                return Promise.resolve(data);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    //@ts-ignore
    completeTecr(input, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { tecrId, otp } = input;
                let data = yield this.emptyCylinder.findById(tecrId);
                if (!data) {
                    throw new exceptions_1.BadInputFormatException('sorry this request was not found');
                }
                if (data.otp !== otp) {
                    throw new exceptions_1.BadInputFormatException('invalid otp provided');
                }
                data.driverStatus = emptyCylinder_1.EcrApproval.APPROVED;
                yield data.save();
                let notifyUser = yield this.user.findOne({ role: 'security', subrole: "head of department" });
                yield new mail_1.default().push({
                    subject: "New TECR",
                    content: `A truck ECR has been registered by ${user.name}, click the link to view: ${static_1.default.FRONTEND_URL}/tecr-details/${data.ecrNo}`,
                    user: notifyUser
                });
                return Promise.resolve(data);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveEcr(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let pwCheck = yield token_1.passWdCheck(user, data.password);
                let { ecrId, status } = data;
                const request = yield this.emptyCylinder.findById(ecrId);
                if (data.status == emptyCylinder_1.EcrApproval.APPROVED) {
                    //@ts-ignore
                    request === null || request === void 0 ? void 0 : request.status = emptyCylinder_1.EcrApproval.APPROVED;
                    //@ts-ignore
                    request === null || request === void 0 ? void 0 : request.position = emptyCylinder_1.ProductionSchedule.NEXT;
                }
                else {
                    //@ts-ignore
                    request === null || request === void 0 ? void 0 : request.status = emptyCylinder_1.EcrApproval.REJECTED;
                }
                let init = yield this.user.findById(request === null || request === void 0 ? void 0 : request.initiator);
                new mail_1.default().push({
                    subject: "ECR Approved",
                    content: `An ECR approval you requested has been ${request === null || request === void 0 ? void 0 : request.status}`,
                    user: init
                });
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Approved ECR',
                        activity: `You approved an ecr`,
                        time: new Date().toISOString()
                    }
                });
                yield (request === null || request === void 0 ? void 0 : request.save());
                return Promise.resolve(request);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchPendingApprovals(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, page, limit, type } = query;
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    sort: { priority: emptyCylinder_1.Priority.URGENT }
                };
                let q = {
                    branch: user.branch,
                    status: emptyCylinder_1.EcrApproval.PENDING,
                };
                let or = [];
                if (search) {
                    or.push({ ecrNo: new RegExp(search, 'gi') });
                }
                if (type) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { type: type });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const request = yield this.emptyCylinder.paginate(q, options);
                return Promise.resolve(request);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = EmptyCylinderModule;
//# sourceMappingURL=index.js.map