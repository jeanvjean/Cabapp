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
const ocn_1 = require("../../models/ocn");
const transferCylinder_1 = require("../../models/transferCylinder");
const mail_1 = require("../../util/mail");
const static_1 = require("../../configs/static");
const exceptions_1 = require("../../exceptions");
const logs_1 = require("../../util/logs");
const token_1 = require("../../util/token");
const cylinder_1 = require("../cylinder");
class OutGoingCylinder extends module_1.default {
    constructor(props) {
        super();
        this.ocn = props.ocn;
        this.user = props.user;
        this.branch = props.branch;
        this.customer = props.customer;
    }
    createOCNRecord(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ocn = new this.ocn(data);
                const hod = yield this.user.findOne({ branch: user.branch, role: user.role, subrole: 'head of department' });
                ocn.branch = user.branch;
                ocn.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                ocn.approvalOfficers.push({
                    name: user.name,
                    id: user._id,
                    office: user.subrole,
                    department: user.role,
                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                });
                let findOcn = yield this.ocn.find({ branch: user.branch }).sort({ ocnInit: -1 }).limit(1);
                let initNum;
                if (findOcn[0] == undefined) {
                    initNum = 1;
                }
                else {
                    initNum = findOcn[0].ocnInit + 1;
                }
                let init = "OCN";
                if (data.noteType == ocn_1.note.IN) {
                    init = "ICN";
                }
                const num = token_1.padLeft(initNum, 6, "");
                let grnNo = init + num;
                if (init == "ICN") {
                    ocn.icnNo = grnNo;
                }
                else if (init == "OCN") {
                    ocn.ocnNo = grnNo;
                }
                // ocn.ocnNo = grnNo;
                ocn.ocnInit = initNum;
                yield ocn.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'OCN request',
                        //@ts-ignore
                        activity: `You created a new out going cylinder note awaiting approval`,
                        time: new Date().toISOString()
                    }
                });
                let apUser = yield this.user.findOne({ role: 'security', subrole: 'head of department', branch: ocn.branch });
                yield new mail_1.default().push({
                    subject: "Outgoing cylinder note (OCN)",
                    content: `OCN generated. click to view ${static_1.default.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                    user: apUser
                });
                return Promise.resolve(ocn);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateOcn(ocnId, data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let ocn = yield this.ocn.findById(ocnId);
                if (!ocn) {
                    throw new exceptions_1.BadInputFormatException('ocn not found');
                }
                let updatedOcn = yield this.ocn.findByIdAndUpdate(ocnId, Object.assign(Object.assign({}, data), { status: ocn_1.statuses.PASSED }), { new: true });
                return Promise.resolve(updatedOcn);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveOcn(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { ocnId, status } = data;
                const ocn = yield this.ocn.findById(ocnId).populate({
                    path: 'customer', model: 'customer'
                });
                console.log(ocn);
                if (!ocn) {
                    throw new exceptions_1.BadInputFormatException('OCN not found');
                }
                if (status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((ocn === null || ocn === void 0 ? void 0 : ocn.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = ocn.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let checkOfficer = ocn.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            ocn.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        //   transfer.tracking.push(track)
                        ocn.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        ocn.nextApprovalOfficer = AO[0].id;
                        //   ocn.comments.push({
                        //     comment:data.comment,
                        //     commentBy:user._id
                        //   })
                        yield ocn.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'OCN',
                                //@ts-ignore
                                activity: `You Rejected an Ocn approval request`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(ocn.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Outgoing cylinder note(OCN)",
                            content: `An OCN you initiated has been rejected please check and make adiquate corrections. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                            user: apUser
                        });
                        return Promise.resolve(ocn);
                    }
                    else if ((ocn === null || ocn === void 0 ? void 0 : ocn.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = ocn.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE2);
                        //   }
                        let checkOfficer = ocn.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            ocn.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        //   ocn.tracking.push(track);
                        ocn.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        ocn.nextApprovalOfficer = AO[0].id;
                        //   ocn.comments.push({
                        //     comment:data.comment,
                        //     commentBy:user._id
                        //   })
                        yield ocn.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'OCN',
                                //@ts-ignore
                                activity: `You Rejected an Ocn approval request`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(ocn.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Outgoing cylinder note(OCN)",
                            content: `An OCN you Approved has been rejected please check and make adiquate corrections. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                            user: apUser
                        });
                        return Promise.resolve(ocn);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    // console.log(hod);
                    if ((ocn === null || ocn === void 0 ? void 0 : ocn.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let checkOfficer = ocn.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        console.log(checkOfficer);
                        if (checkOfficer.length == 0) {
                            ocn.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        //   ocn.tracking.push(track)
                        ocn.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        ocn.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        //   ocn.comments.push({
                        //     comment:data.comment,
                        //     commentBy:user._id
                        //   })
                        // console.log(ocn)
                        yield ocn.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'OCN',
                                //@ts-ignore
                                activity: `You Approved an OCN approval request for ${ocn.customer.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(ocn.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Outgoing cylinder note(OCN)",
                            content: `An OCN has been initiatedand requires your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                            user: apUser
                        });
                        return Promise.resolve(ocn);
                    }
                    else if ((ocn === null || ocn === void 0 ? void 0 : ocn.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let checkOfficer = ocn.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            ocn.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        // ocn.tracking.push(track)
                        ocn.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        // console.log(hod)
                        let branchAdmin = yield this.user.findOne({ branch: hod === null || hod === void 0 ? void 0 : hod.branch, subrole: "superadmin" });
                        //@ts-ignore
                        ocn.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
                        //   ocn.comments.push({
                        //     comment:data.comment,
                        //     commentBy:user._id
                        //   })
                        yield ocn.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'OCN',
                                //@ts-ignore
                                activity: `You Approved an OCN approval request for ${ocn.customer.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(ocn.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Outgoing cylinder note(OCN)",
                            content: `An OCN has been initiatedand requires your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                            user: apUser
                        });
                        return Promise.resolve(ocn);
                    }
                    else if ((ocn === null || ocn === void 0 ? void 0 : ocn.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let checkOfficer = ocn.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            ocn.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        //   transfer.tracking.push(track)
                        ocn.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        ocn.approvalStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        //@ts-ignore
                        // transfer.nextApprovalOfficer = data.nextApprovalOfficer
                        //   transfer.comments.push(ocn);
                        yield ocn.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'OCN',
                                //@ts-ignore
                                activity: `You Approved an OCN approval request for ${ocn.customer.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findOne({ role: 'security', subrole: 'head of department', branch: ocn.branch });
                        yield new mail_1.default().push({
                            subject: "Outgoing cylinder note (OCN)",
                            content: `OCN approval complete. click to view ${static_1.default.FRONTEND_URL}/fetch-ocn-details/${ocn._id}`,
                            user: apUser
                        });
                        return Promise.resolve(ocn);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchOcnApprovals(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, page, limit } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 1,
                    populate: [
                        { path: "customer", model: "customer" },
                        { path: "branch", model: "branches" },
                        { path: "nextApprovalOfficer", model: "User" }
                    ]
                };
                let q = {
                    branch: user.branch,
                    nextApprovalOfficer: user._id,
                    approvalStatus: transferCylinder_1.TransferStatus.PENDING
                };
                let or = [];
                if (search) {
                    or.push({ cylinderType: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const outgoing = yield this.ocn.paginate(q, options);
                return Promise.resolve(outgoing);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchOcns(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 1,
                    populate: [
                        { path: "customer", model: "customer" },
                        { path: "branch", model: "branches" },
                        { path: "nextApprovalOfficer", model: "User" }
                    ]
                };
                let q = {
                    branch: user.branch,
                };
                let or = [];
                if (search) {
                    or.push({ cylinderType: new RegExp(search, 'gi') });
                    or.push({ approvalStatus: new RegExp(search, 'gi') });
                    or.push({ icnNo: new RegExp(search, "gi") });
                    or.push({ ocnNo: new RegExp(search, 'gi') });
                }
                if (filter) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { status: filter });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const outgoing = yield this.ocn.paginate(q, options);
                return Promise.resolve(outgoing);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    viewOcnDetails(ocnId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const outgoing = yield this.ocn.findById(ocnId).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'approvalOfficers', model: 'User' },
                    { path: 'nextApprovalOfficer', model: 'User' },
                    { path: 'branch', model: 'branches' },
                    { path: "cylinders", model: "registered-cylinders" }
                ]);
                return Promise.resolve(outgoing);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = OutGoingCylinder;
//# sourceMappingURL=index.js.map