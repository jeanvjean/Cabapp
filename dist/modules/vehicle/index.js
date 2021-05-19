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
const exceptions_1 = require("../../exceptions");
const vehicle_1 = require("../../models/vehicle");
const module_1 = require("../module");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
class Vehicle extends module_1.default {
    constructor(props) {
        super();
        this.vehicle = props.vehicle;
        this.pickup = props.pickup;
        this.user = props.user;
    }
    createVehicle(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.create(Object.assign(Object.assign({}, data), { branch: user.branch }));
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
                let approvalUser = yield this.user.findById({ role: 'sales', subrole: 'head of department', branch: vehicle === null || vehicle === void 0 ? void 0 : vehicle.branch });
                new mail_1.default().push({
                    subject: "Vehicle inspection",
                    content: `A vehicle inspection request requires your approval. click to view ${static_1.default.FRONTEND_URL}/view-inspection-history/${vehicle === null || vehicle === void 0 ? void 0 : vehicle._id}`,
                    user: approvalUser
                });
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    viewInspection(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.findById(data.vehicleId);
                //@ts-ignore
                let inspection = vehicle === null || vehicle === void 0 ? void 0 : vehicle.maintainace.filter(inspect => `${inspect._id}` == `${data.inspectionId}`);
                //@ts-ignore
                return Promise.resolve(inspection[0]);
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
                const vehicle = yield this.vehicle.findById(params.vehicleId);
                if (!vehicle) {
                    throw new exceptions_1.BadInputFormatException('selected vehicle was not found please pick an available vehicle');
                }
                let routePlan = new this.pickup(data);
                let availableRoutes = yield this.pickup.find();
                let docs = availableRoutes.map(doc => doc.serialNo);
                //@ts-ignore
                let maxNumber = Math.max(...docs);
                let sn = maxNumber + 1;
                routePlan.serialNo = sn | 1;
                yield routePlan.save();
                return Promise.resolve(routePlan);
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
                //@ts-ignore
                const routePlan = yield this.pickup.find({ vehicle: `${vehicleId}` });
                return Promise.resolve(routePlan);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markRouteAsComplete(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, routeId } = data;
                const pickup = yield this.pickup.findById(routeId);
                //@ts-ignore
                pickup === null || pickup === void 0 ? void 0 : pickup.status = status;
                return Promise.resolve(pickup);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Vehicle;
//# sourceMappingURL=index.js.map