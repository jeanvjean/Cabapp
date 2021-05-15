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
const exceptions_1 = require("../../exceptions");
class Account extends module_1.default {
    constructor(props) {
        super();
        this.account = props.account;
    }
    createReciept(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reciept = new this.account(data);
                reciept.outstandingBalance = reciept.totalAmount - reciept.amountPaid;
                let exists = yield this.account.find();
                let sn;
                let nums = exists.map(doc => doc.invoiceNo);
                let maxNum = Math.max(...nums);
                sn = maxNum + 1;
                reciept.invoiceNo = sn | 1;
                yield reciept.save();
                return Promise.resolve(reciept);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchInvoices(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const invoices = yield this.account.find({ branch: user.branch });
                return Promise.resolve(invoices);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    viewInvoiceDetails(invoiceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const invoice = yield this.account.findById(invoiceId).populate({
                    path: 'preparedBy', model: 'users'
                });
                return Promise.resolve(invoice);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateInvoice(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { invoiceId, update } = data;
                const invoice = yield this.account.findById(invoiceId);
                if (!invoice) {
                    throw new exceptions_1.BadInputFormatException('invoice not found');
                }
                if (update === null || update === void 0 ? void 0 : update.amountPaid) {
                    invoice.outstandingBalance = invoice.outstandingBalance - update.amountPaid;
                    yield invoice.save();
                }
                // let updated =  await this.account.findByIdAndUpdate(invoiceId, {$set:update}, {new:true});
                let message = (invoice === null || invoice === void 0 ? void 0 : invoice.outstandingBalance) <= 0 ? 'Paid out' : 'payment updated';
                return Promise.resolve({
                    message,
                    invoice: invoice
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Account;
//# sourceMappingURL=index.js.map