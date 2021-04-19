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
const vehicle_1 = require("../../models/vehicle");
const module_1 = require("../module");
class Vehicle extends module_1.default {
    constructor(props) {
        super();
        this.vehicle = props.vehicle;
    }
    createVehicle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.create(data);
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchVehicles(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicles = yield this.vehicle.find(query);
                return Promise.resolve(vehicles);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchVehicle(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.findById(id);
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    vehicleInspection(id, data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.findById(id);
                let vinspection = {
                    type: data.type,
                    operation: data.operation,
                    date: data.date,
                    cost: data.cost,
                    curMileage: data.curMileage,
                    prevMileage: data.prevMileage,
                    itemsReplaced: data.itemsReplaced,
                    approvalOfficer: data.approvalOfficer,
                    approvalStatus: vehicle_1.InspectApproval.PENDING
                };
                let com = {
                    comment: data.comment,
                    commentBy: user._id
                };
                //@ts-ignore
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.maintainace.push(Object.assign(Object.assign({}, vinspection), { comments: [com] }));
                yield (vehicle === null || vehicle === void 0 ? void 0 : vehicle.save());
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchInspectionHist(id, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.findById(id);
                let inspection = vehicle === null || vehicle === void 0 ? void 0 : vehicle.maintainace;
                let corrective = inspection === null || inspection === void 0 ? void 0 : inspection.filter(inspect => inspect.type == vehicle_1.maintType.CORRECTIVE);
                let pre_inspection = inspection === null || inspection === void 0 ? void 0 : inspection.filter(inspect => inspect.type == vehicle_1.maintType.PREINSPECTION);
                let route = vehicle === null || vehicle === void 0 ? void 0 : vehicle.routes;
                return Promise.resolve({
                    inspection,
                    pre_inspection,
                    corrective,
                    vehicleRoute: route,
                    message: 'inspection history fetched'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    aprroveInspection(data, user) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.findById(data.vehicleId);
                //@ts-ignore
                let inspection = vehicle === null || vehicle === void 0 ? void 0 : vehicle.maintainace.filter(inspect => `${inspect._id}` == `${data.inspectionId}`);
                if (data.status == vehicle_1.InspectApproval.APPROVED) {
                    //@ts-ignore
                    inspection[0].approvalStatus = vehicle_1.InspectApproval.APPROVED;
                    let com = {
                        comment: data.comment,
                        commentBy: user._id
                    };
                    if (data.comment) {
                        //@ts-ignore
                        (_a = inspection[0].comments) === null || _a === void 0 ? void 0 : _a.push(com);
                    }
                }
                else if (data.status == vehicle_1.InspectApproval.REJECTED) {
                    //@ts-ignore
                    inspection[0].approvalStatus = vehicle_1.InspectApproval.REJECTED;
                    let com = {
                        comment: data.comment,
                        commentBy: user._id
                    };
                    if (data.comment) {
                        //@ts-ignore
                        (_b = inspection[0].comments) === null || _b === void 0 ? void 0 : _b.push(com);
                    }
                }
                yield (vehicle === null || vehicle === void 0 ? void 0 : vehicle.save());
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    recordRoute(data, params, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(params);
                const vehicle = yield this.vehicle.findById(params.vehicleId);
                let route;
                if (data.activity == vehicle_1.RouteActivity.DELIVERY) {
                    route = {
                        driver: data.driver,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        activity: vehicle_1.RouteActivity.DELIVERY,
                        destination: data.destination,
                        departure: data.departure
                    };
                }
                else if (data.activity == vehicle_1.RouteActivity.PICKUP) {
                    route = {
                        driver: data.driver,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        activity: vehicle_1.RouteActivity.DELIVERY,
                        destination: data.destination,
                        departure: data.departure
                    };
                }
                //@ts-ignore
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.routes.push(route);
                yield (vehicle === null || vehicle === void 0 ? void 0 : vehicle.save());
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    assignDriver(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.findById(data.vehicleId);
                //@ts-ignore
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.assignedTo = data.driver;
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.comments.push({
                    //@ts-ignore
                    comment: data.comment,
                    commentBy: user._id
                });
                yield (vehicle === null || vehicle === void 0 ? void 0 : vehicle.save());
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteVehicle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId } = data;
                yield this.vehicle.findByIdAndDelete(vehicleId);
                return Promise.resolve({
                    message: 'Vehicle deleted from the system'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    removeDriver(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId, driver } = data;
                const vehicle = yield this.vehicle.findById(vehicleId);
                // if(`${vehicle?.assignedTo}` == `${driver}`) {
                //   vehicle?.assignedTo = null
                // }
                //@ts-ignore
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.assignedTo = null;
                yield (vehicle === null || vehicle === void 0 ? void 0 : vehicle.save());
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchRoutePlan(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId } = data;
                const vehicle = yield this.vehicle.findById(vehicleId);
                let routePlan = vehicle === null || vehicle === void 0 ? void 0 : vehicle.routes;
                return Promise.resolve({
                    routePlan
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markRouteAsComplete(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId, status, routeId } = data;
                const vehicle = yield this.vehicle.findById(vehicleId);
                //@ts-ignore
                let route = vehicle === null || vehicle === void 0 ? void 0 : vehicle.routes.filter(route => `${route._id}` == `${routeId}`);
                //@ts-ignore
                route[0].status = status;
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.save();
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Vehicle;
//# sourceMappingURL=index.js.map