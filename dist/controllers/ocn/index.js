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
class ocnController extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    recordOcn() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createOCNRecord(req.body, req.user);
                this.ok(res, 'record created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveOcn() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.approveOcn(Object.assign(Object.assign({}, req.body), { ocnId: req.params.ocnId }), req.user);
                this.ok(res, `approval ${data === null || data === void 0 ? void 0 : data.approvalStage} done`, data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchOcnApprovals() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchOcnApprovals(req.query, req.user);
                this.ok(res, 'fetched pending approvals', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchOcnDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.viewOcnDetails(req.params.ocnId);
                this.ok(res, 'fetched details', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    updateOcn() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.updateOcn(req.params.ocnId, req.body, req.user);
                this.ok(res, 'done', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchOcns() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchOcns(req.query, req.user);
                this.ok(res, 'fetched ocns', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = ocnController;
//# sourceMappingURL=index.js.map