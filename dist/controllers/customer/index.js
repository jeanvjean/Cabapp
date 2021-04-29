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
                //@ts-ignore
                cac = yield driver_1.uploadFile(req.files.CAC, 'customer-document/cac');
                //@ts-ignore
                validId = yield driver_1.uploadFile(req.files.validId, 'customer-document/valid-id');
                const data = yield this.module.createCustomer(Object.assign(Object.assign({}, req.body), { CAC: cac, validID: validId }));
                this.ok(res, 'ok', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchCustomers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchCustomers(req.query);
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    createOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { customerId } = req.params;
                const data = yield this.module.createOrder(Object.assign(Object.assign({}, req.body), { customer: customerId }));
                this.ok(res, 'ok', data);
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
                this.ok(res, 'ok', data);
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
                const data = yield this.module.markOrderAsDone({ orderId, status });
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
    createComplaint() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, issue, comment } = req.body;
                const { customerId } = req.params;
                //@ts-ignore
                const data = yield this.module.makeComplaint({ customer: customerId, title, issue, comment });
                this.ok(res, 'complain registered', data);
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
}
exports.default = customerCtrl;
//# sourceMappingURL=index.js.map