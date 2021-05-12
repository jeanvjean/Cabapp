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
class ProductionController extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createProductionSchedule() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.createProductionSchedule(req.body, req.user);
                this.ok(res, 'Schedule created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveProductionSchedule() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.approveProductionSchedule(req.body, req.user);
                this.ok(res, 'Approved ', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchPendingProductionApprovals() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchPendingProductionApprovals(req.query, req.user);
                this.ok(res, 'Fetched pending approvals', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    viewProductionSchedule() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.viewProductionSchedule(req.params.productionId);
                this.ok(res, 'Fetched detailes', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchProductions() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                // @ts-ignore
                const data = yield this.module.fetchApprovedSchedules(req.query, req.user);
                this.ok(res, 'Fetched production schedules', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    markCompletedProduction() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.markCompletedProduction(req.params.productionId);
                this.ok(res, 'Production complete', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    markCompletedCylinders() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.markcompletedCylinders(req.body);
                this.ok(res, 'updated completed cylinders', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = ProductionController;
//# sourceMappingURL=index.js.map