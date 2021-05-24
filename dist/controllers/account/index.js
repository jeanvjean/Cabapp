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
class accountController extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createInvoice() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createReciept(req.body, req.user);
                this.ok(res, 'invoice created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchInvoices() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchInvoices(req.user);
                this.ok(res, 'invoices fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchInvoiceDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.viewInvoiceDetails(req.params.invoiceId);
                this.ok(res, 'Invoice details', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    updateInvoice() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { invoiceId } = req.params;
                const data = yield this.module.updateInvoice({ invoiceId, update: Object.assign({}, req.body) });
                this.ok(res, `${data === null || data === void 0 ? void 0 : data.message}`, data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = accountController;
//# sourceMappingURL=index.js.map