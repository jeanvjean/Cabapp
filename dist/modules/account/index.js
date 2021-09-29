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
const logs_1 = require("../../util/logs");
const token_1 = require("../../util/token");
const cylinder_1 = require("../cylinder");
class Account extends module_1.default {
    constructor(props) {
        super();
        this.account = props.account;
    }
    createReciept(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reciept = new this.account(Object.assign(Object.assign({}, data), { branch: user.branch }));
                reciept.outstandingBalance = reciept.totalAmount - reciept.amountPaid;
                let exists = yield this.account.find({}).sort({ invInit: -1 }).limit(1);
                let sn;
                if (exists[0]) {
                    sn = exists[0].invInit++;
                }
                else {
                    sn = 1;
                }
                let init = 'INV';
                let invoiceNumber = token_1.padLeft(sn, 6, "");
                reciept.invoiceNo = init + invoiceNumber;
                yield reciept.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Reciept',
                        //@ts-ignore
                        activity: `You issued a reciept for purchase`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(reciept);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchInvoices(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search } = query;
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const options = {
                    page: query.page,
                    limit: query.limit,
                    populate: {
                        path: 'preparedBy', model: 'User'
                    }
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ invoiceNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const invoices = yield this.account.paginate(q, options);
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
                    path: 'preparedBy', model: 'User'
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