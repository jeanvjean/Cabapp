"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferSchema = exports.ApprovalOfficerSchema = exports.approvalStageShema = exports.commentSchema = exports.TransferType = exports.ApprovalStatus = exports.TransferStatus = exports.stagesOfApproval = void 0;
const mongoose_1 = require("mongoose");
var stagesOfApproval;
(function (stagesOfApproval) {
    stagesOfApproval["START"] = "start";
    stagesOfApproval["STAGE1"] = "stage1";
    stagesOfApproval["STAGE2"] = "stage2";
    stagesOfApproval["STAGE3"] = "stage3";
    stagesOfApproval["APPROVED"] = "approved";
})(stagesOfApproval = exports.stagesOfApproval || (exports.stagesOfApproval = {}));
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["PENDING"] = "pending";
    TransferStatus["COMPLETED"] = "completed";
})(TransferStatus = exports.TransferStatus || (exports.TransferStatus = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
})(ApprovalStatus = exports.ApprovalStatus || (exports.ApprovalStatus = {}));
var TransferType;
(function (TransferType) {
    TransferType["PERMANENT"] = "permanent";
    TransferType["TEMPORARY"] = "temporary";
    TransferType["DIVISION"] = "within-division";
    TransferType["CONDEMN"] = "condemn";
    TransferType["REPAIR"] = "repair";
    TransferType["BRANCH"] = "branch";
})(TransferType = exports.TransferType || (exports.TransferType = {}));
exports.commentSchema = new mongoose_1.Schema({
    comment: { type: String },
    commentBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});
exports.approvalStageShema = new mongoose_1.Schema({
    title: { type: String },
    stage: { type: String, enum: Object.values(stagesOfApproval) },
    status: { type: String, enum: Object.values(ApprovalStatus) },
    dateApproved: { type: Date },
    comment: [exports.commentSchema],
    approvalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});
exports.ApprovalOfficerSchema = new mongoose_1.Schema({
    name: { type: String },
    id: { type: mongoose_1.Schema.Types.ObjectId },
    office: { type: String },
    department: { type: String },
    stageOfApproval: { type: String, enum: Object.values(stagesOfApproval) }
});
exports.TransferSchema = new mongoose_1.Schema({
    cylinders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'registered-cylinders' }],
    initiator: { type: mongoose_1.Schema.Types.ObjectId },
    to: { type: mongoose_1.Schema.Types.ObjectId },
    tracking: {
        type: [exports.approvalStageShema]
    },
    transferStatus: {
        type: String,
        enum: Object.values(TransferStatus)
    },
    approvalStage: {
        type: String,
        enum: Object.values(stagesOfApproval)
    },
    type: {
        type: String,
        enum: Object.values(TransferType)
    },
    approvalOfficers: [exports.ApprovalOfficerSchema],
    comments: [exports.commentSchema],
    nextApprovalOfficer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users' },
    holdingTime: { type: Date },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    toBranch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    toDepartment: { type: String },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' }
}, {
    timestamps: true
});
function factory(conn) {
    return conn.model('transfer-cylinder', exports.TransferSchema);
}
exports.default = factory;
//# sourceMappingURL=transferCylinder.js.map