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
class VehicleController extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createVehicle() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const vehicle = yield this.module.createVehicle(req.body, req.user);
                this.ok(res, 'Created', vehicle);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    updateVehicle() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.updateVehicle(Object.assign(Object.assign({}, req.body), { vehicleId: req.params.vehicleId }), req.user);
                this.ok(res, 'updated vehicle', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchVehicles() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const vehicles = yield this.module.fetchVehicles(req.query, req.user);
                this.ok(res, 'Fetched list', vehicles);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchVehicle() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.module.fetchVehicle(req.params.id);
                this.ok(res, 'details fetched', vehicle);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    vehicleInspection() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const vehicle = yield this.module.vehicleInspection(req.params.vehicleId, req.body, req.user);
                this.ok(res, 'Recorded', vehicle);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchInspectionHistory() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchInspectionHist(req.params.vehicleId, req.query);
                this.ok(res, 'History fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    approveInspection() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId, inspectionId } = req.params;
                const { status, comment } = req.body;
                //@ts-ignore
                const data = yield this.module.aprroveInspection({ vehicleId, inspectionId, status, comment }, req.user);
                this.ok(res, 'Approved', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    recordRoute() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.recordRoute(Object.assign(Object.assign({}, req.body), { vehicle: req.params.vehicleId }), req.params, req.user);
                this.ok(res, 'Recorded', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    startRoute() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.startRoute(req.params.routeId, req.body);
                this.ok(res, 'route plan started', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchVehiclePerformance() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchVehiclePerformance(req.query, req.params.vehicleId);
                this.ok(res, 'vehicle history', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchRoutePlan() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId } = req.params;
                //@ts-ignore
                const data = yield this.module.fetchRoutePlan({ vehicleId, query: req.query });
                this.ok(res, 'fetched route plans', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    assignDriver() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId } = req.params;
                const { comment, driver } = req.body;
                //@ts-ignore
                const data = yield this.module.assignDriver({ vehicleId, comment, driver }, req.user);
                this.ok(res, 'Driver has been assigned', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    deleteVehicle() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.deleteVehicle({ vehicleId: req.params.vehicleId });
                this.ok(res, 'Vehicle deleted', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    removeDriver() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId, driver } = req.params;
                const data = yield this.module.removeDriver({ vehicleId, driver });
                this.ok(res, 'Driver removed', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    markRouteAsComplete() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId, routeId } = req.params;
                const { status } = req.body;
                //@ts-ignore
                const data = yield this.module.markRouteAsComplete({ vehicleId, routeId, status, query: req.query });
                this.ok(res, 'Completed', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    viewInspectionDetails() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId, inspectionId } = req.params;
                const data = yield this.module.viewInspection({ vehicleId, inspectionId });
                this.ok(res, 'vehicle inspection details', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchActivityLogs() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.module.fetchActivityLogs(req.params.userId);
                this.ok(res, 'activity logs fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchallVehicles() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchallVehicles(req.user);
                this.ok(res, 'vehicles fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.default = VehicleController;
//# sourceMappingURL=index.js.map