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
class PurchaseOrderCtrl extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createPurchserOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createPurchaseOrder(req.body, req.user);
                this.ok(res, 'created purchase order', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPurchases() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchPurchaseOrders(req.query, req.user);
                this.ok(res, 'fetched purchase orders', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approvePurchaseOrder() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { purchaseId } = req.params;
                //@ts-ignore
                const data = yield this.module.approvePurchaseOrder(Object.assign(Object.assign({}, req.body), { purchaseId }), req.user);
                this.ok(res, 'approved purchase order', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPurchaseApprovals() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchPurchaseOrderRequests(req.query, req.user);
                this.ok(res, 'purchase order requests fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    viewOrderDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchOrderDetails(req.params.orderId);
                this.ok(res, 'Order details fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = PurchaseOrderCtrl;
//# sourceMappingURL=index.js.map