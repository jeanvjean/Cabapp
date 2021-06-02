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
const driver_1 = require("../driver");
const validator_1 = require("./validator");
exports.Validator = validator_1.default;
class customerCtrl extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createCustomer() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                let cac;
                let validId;
                if (req.files) {
                    //@ts-ignore
                    cac = yield driver_1.uploadFile(req.files.CAC, 'customer-document/cac');
                    //@ts-ignore
                    validId = yield driver_1.uploadFile(req.files.validId, 'customer-document/valid-id');
                }
                //@ts-ignore
                const data = yield this.module.createCustomer(Object.assign(Object.assign({}, req.body), { CAC: cac, validID: validId }), req.user);
                this.ok(res, 'Created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCustomers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchCustomers(req.query, req.user);
                this.ok(res, 'Fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCustomer() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { customerId } = req.params;
                const data = yield this.module.fetchCustomerDetails(customerId);
                this.ok(res, 'Fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    createOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createOrder(Object.assign({}, req.body), req.user);
                this.ok(res, 'Created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchUserOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { customerId } = req.params;
                const data = yield this.module.fetchCustomerOrder(customerId);
                this.ok(res, 'Fetched Orders', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    markOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const { status } = req.body;
                //@ts-ignore
                const data = yield this.module.markOrderAsDone({ orderId, status }, req.user);
                this.ok(res, 'changed status', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    orderDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.viewOrder(req.params.orderId);
                this.ok(res, 'order details fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    deletePickupOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.deletePickupOrder(req.params.orderId);
                this.ok(res, `${data.message}`);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    assignOrderToVehicle() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.assignOrderToVehicle(Object.assign(Object.assign({}, req.body), { orderId: req.params.orderId }), req.user);
                this.ok(res, 'order assigned to vehicle', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCreatedOrders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchAllOrders(req.user);
                this.ok(res, 'fetched all orders', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchOrdersForVehicle() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchOrdersAssignedToVehicle({ vehicle: req.params.vehicleId });
                this.ok(res, 'orders fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    createComplaint() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, issue, comment } = req.body;
                const { customerId } = req.params;
                //@ts-ignore
                const data = yield this.module.makeComplaint(Object.assign({}, req.body), req.user);
                this.ok(res, 'complain registered', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveComplaint() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { complaintId } = req.params;
                //@ts-ignore
                const data = yield this.module.approveComplaint(Object.assign(Object.assign({}, req.body), { id: complaintId }), req.user);
                this.ok(res, 'Approval status updated', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchComplaints() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchComplaints(req.params.customerId);
                this.ok(res, 'complaints fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPendingComplaintApproval() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchUserComplaintApproval(req.query, req.user);
                this.ok(res, 'pending approvals fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchApprovedComplaints() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchApprovedComplaints(req.query, req.user);
                this.ok(res, 'complaints fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    updateTracking() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const data = yield this.module.updateTracking(Object.assign(Object.assign({}, req.body), { orderId }));
                this.ok(res, 'tracking updated', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    resolveComplaint() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.resolveComplaint(req.params.complaintId, req.user);
                this.ok(res, 'Complaint resolved', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    registerWalkinCustomer() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.registerWalkinCustomers(req.body, req.user);
                this.ok(res, 'customer registered', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchWalkinCustomers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchWalkinCustomers(req.query, req.user);
                this.ok(res, 'fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchWalkinCustomer() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchWalkinCustomer(req.params.customerId);
                this.ok(res, 'customer fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    markCustomerAsFilled() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.markFilledCustomer(req.params.customerId);
                this.ok(res, 'marked as full', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    deleteWalkinCustomer() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.deleteWalkinCustomer(req.params.customerId, req.user);
                this.ok(res, 'customer deleted', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchFilledCustomerCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchFilledCustomerCylinders(req.query, req.user);
                this.ok(res, 'Filled cylinders', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = customerCtrl;
//# sourceMappingURL=index.js.map