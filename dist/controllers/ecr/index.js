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
const ctrl_1 = require("../ctrl");
class EcrController extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createEcr() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createECR(req.body, req.user);
                this.ok(res, 'ecr created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchEcr() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.emptyCylinderPool(req.query, req.user);
                this.ok(res, 'fetched ecr', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    ecrDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchEcrdetails(req.params.ecrId);
                this.ok(res, 'data fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveEcr() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.approveEcr(req.body, req.user);
                this.ok(res, 'done', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPendingApprovals() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchPendingApprovals(req.query, req.user);
                this.ok(res, 'fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = EcrController;
//# sourceMappingURL=index.js.map