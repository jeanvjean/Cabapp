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
class Customer extends module_1.default {
    constructor(props) {
        super();
        this.customer = props.customer;
        this.order = props.order;
    }
    createCustomer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.customer.create(Object.assign({}, data));
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customers = yield this.customer.find(query);
                return Promise.resolve(customers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomerDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield this.customer.findById(id);
                return Promise.resolve(customer);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    createOrder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.order.create(data);
                return Promise.resolve(order);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchCustomerOrder(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const orders = yield this.order.find({ customer: `${customerId}` }).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'vehicle', model: 'vehicle' }
                ]);
                console.log(orders);
                return Promise.resolve(orders);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Customer;
//# sourceMappingURL=index.js.map