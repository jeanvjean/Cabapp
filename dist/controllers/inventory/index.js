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
const validation_1 = require("./validation");
exports.Validator = validation_1.default;
class ProductCtrl extends ctrl_1.default {
    constructor(props) {
        super();
        this.module = props;
    }
    createProduct() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createProduct(req.body, req.user);
                this.ok(res, 'ok', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchProducts() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const products = yield this.module.fetchProducts(req.query, req.user);
                this.ok(res, 'ok', products);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchProduct() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                //@ts-ignore
                const product = yield this.module.fetchProduct(id, req.user);
                this.ok(res, 'ok', product);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    createSupplier() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const supplier = yield this.module.createSupplier(req.body, req.user);
                this.ok(res, 'ok', supplier);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    addInventory() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const inventory = yield this.module.addInventory(req.body);
                this.ok(res, 'ok', inventory);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    disburseProducts() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const disbursement = yield this.module.disburseProduct(req.body, req.user);
                this.ok(res, 'ok', disbursement);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveDisbursement() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.approveDisbursment(req.body, req.user);
                this.ok(res, 'ok', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchDisburseApprovals() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const disbursements = yield this.module.fetchusersDisburseApprovals(req.query, req.user);
                this.ok(res, 'ok', disbursements);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchDisbursement() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursement = yield this.module.fetchDisbursement(req.params.id);
                this.ok(res, 'ok', disbursement);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchDisbursements() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursement = yield this.module.fetchDisburseRequests(req.query);
                this.ok(res, 'ok', disbursement);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = ProductCtrl;
//# sourceMappingURL=index.js.map