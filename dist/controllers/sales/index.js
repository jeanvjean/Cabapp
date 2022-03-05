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
class SalesCtrl extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createSalesReq() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createSalesRequisition(req.body, req.user);
                this.ok(res, 'created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchSalesReq() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchSalesRequisition(req.query, req.user);
                this.ok(res, 'fetched requisitions', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchRequisitionDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchSalesReqDetails(req.params.salesId);
                this.ok(res, 'Details fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveSalesRequisition() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.approveSalesRequisition(req.body, req.user);
                this.ok(res, 'approved', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPendingSaleRequisition() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchPendingRequisitionApproval(req.query, req.user);
                this.ok(res, 'fetched pending approvals', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    returnedCylinder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.returnedCylinder(req.params.cylinderId);
                this.ok(res, 'cylinder has been returned', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    salesReportCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.cylinderTransactions(req.user);
                this.ok(res, 'cylinder report fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    salesOrderReport() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.salesOrderTransaction(req.query, req.user);
                this.ok(res, 'sales order report', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    purchaseOrderReport() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.purchaseOrderReport(req.query, req.user);
                this.ok(res, 'purchase order report', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    purchaseReportDowndload() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.purchaseReportDowndload(req.user);
                this.ok(res, 'download data', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    salesOrderDownload() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.salesOrderDownload(req.user);
                this.ok(res, 'sales order report', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    salesReportCylindersDownload() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.cylinderTransactionsDownload(req.user);
                this.ok(res, 'cylinder report fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = SalesCtrl;
//# sourceMappingURL=index.js.map