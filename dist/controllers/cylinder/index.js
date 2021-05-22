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
exports.Validator = void 0;
const ctrl_1 = require("../ctrl");
const validator_1 = require("./validator");
exports.Validator = validator_1.default;
class CylinderController extends ctrl_1.default {
    constructor(module) {
        super(),
            this.module = module;
    }
    createCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                let cylinder = yield this.module.createCylinder(req.body, req.user);
                this.ok(res, 'Created', cylinder);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const list = yield this.module.fetchCylinders(req.query);
                this.ok(res, 'fetched cylinder types', list);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    cylinderDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const cylinder = yield this.module.cylinderDetails(id);
                this.ok(res, 'Cylinder type', cylinder);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    registerCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.regCylinder(req.body, req.user);
                this.ok(res, 'Registered', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchRegisteredCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchRegisteredCylinders(req.query, req.user);
                ;
                this.ok(res, 'fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchRegisteredCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                //@ts-ignore
                const cylinder = yield this.module.fetchRegisteredCylinder(id, req.user);
                this.ok(res, 'Fetched details', cylinder);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    transferCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const transfer = yield this.module.transferCylinders(req.body, req.user);
                this.ok(res, 'Transfer Initiated', transfer);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveTransfer() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const approval = yield this.module.approveTransfer(req.body, req.user);
                this.ok(res, `${approval === null || approval === void 0 ? void 0 : approval.message}`, approval);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchTransferRequests() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const transfers = yield this.module.fetchTransferRequets(req.query);
                this.ok(res, 'fetched', transfers);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchTransferDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchTransferDetails(req.params.id);
                this.ok(res, 'fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    usersPendingApprovals() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchUserPendingApproval(req.query, req.user);
                this.ok(res, 'Pending approvals fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    deleteRegisteredCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { cylinderId } = req.params;
                //@ts-ignore
                const data = yield this.module.deleteRegisteredCylinder(cylinderId, req.user);
                this.ok(res, 'Deleted', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchFaultyCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchFaultyCylinders(req.query, req.user);
                this.ok(res, 'fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCustomerCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchCustomerCylinders(req.params.customerId);
                this.ok(res, 'fetched cylinders', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCompletedTransfers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchTransferReport(req.query);
                this.ok(res, 'transfer report fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    faultyCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.faultyCylinder(req.params.cylinderId);
                this.ok(res, 'cylinder marked as faulty', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    condemnCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.condemnCylinder(req.params.cylinderId);
                this.ok(res, 'archived cylinder', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCondemnCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchArchivedCylinder(req.query, req.user);
                this.ok(res, 'archive fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fixFaultyCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fixedFaultyCylinder(req.params.cylinderId);
                this.ok(res, 'cylinder fixed', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = CylinderController;
//# sourceMappingURL=index.js.map