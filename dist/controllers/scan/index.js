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
class ScanController extends ctrl_1.default {
    constructor(module) {
        super(),
            this.module = module;
    }
    startScan() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.ScanCylinder(req.query);
                this.ok(res, 'scanning', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    initiateScan() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.initiateScan();
                this.ok(res, 'scan started', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchScans() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchScans(req.query);
                this.ok(res, 'all scans', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    scanInfo() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.scanInfo(req.params.formId);
                this.ok(res, 'scan info', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    complete() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.complete(req.params.formId);
                this.ok(res, 'scan complete', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    update() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.updateCyliderScan(req.body);
                this.ok(res, 'update', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = ScanController;
//# sourceMappingURL=index.js.map