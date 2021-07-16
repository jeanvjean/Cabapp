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
exports.schedule = void 0;
const exceptions_1 = require("../../exceptions");
const vehicle_1 = require("../../models/vehicle");
const module_1 = require("../module");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
const logs_1 = require("../../util/logs");
const order_1 = require("../../models/order");
const registeredCylinders_1 = require("../../models/registeredCylinders");
const token_1 = require("../../util/token");
const schedule = require("node-schedule");
exports.schedule = schedule;
const resolve_template_1 = require("../../util/resolve-template");
class Vehicle extends module_1.default {
    constructor(props) {
        super();
        this.vehicle = props.vehicle;
        this.pickup = props.pickup;
        this.user = props.user;
        this.activity = props.activity;
        this.registerCylinder = props.registerCylinder;
        this.branch = props.branch;
    }
    createVehicle(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicle = yield this.vehicle.create(Object.assign(Object.assign({}, data), { branch: user.branch }));
                let branch = yield this.branch.findById(vehicle.branch).populate([
                    { path: 'branchAdmin', model: "User" }
                ]);
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'create vehicle',
                        activity: `You added a vehicle to your vehicle list`,
                        time: new Date().toISOString()
                    }
                });
                let date = new Date(vehicle.insuranceDate);
                let firstDate = date.setDate(date.getDate() - +14);
                let secondDate = date.setDate(date.getDate() - +7);
                let thirdDate = date.setDate(date.getDate() - +1);
                schedule.scheduleJob(new Date(firstDate), function (id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const html = yield resolve_template_1.getTemplate('licencenotice', {
                            date: vehicle.insuranceDate,
                            remaining: 14,
                            registration: vehicle.regNo,
                            vehicleType: vehicle.vehicleType,
                            model: vehicle.vModel,
                            //@ts-ignore
                            name: branch.branchAdmin.name
                        });
                        let payload = {
                            content: html,
                            subject: 'Vehicle licence notification',
                            //@ts-ignore
                            email: branch.branchAdmin.email
                        };
                        new mail_1.default().sendMail(payload);
                    });
                }.bind(null, vehicle._id));
                schedule.scheduleJob(new Date(secondDate), function (id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const html = yield resolve_template_1.getTemplate('licencenotice', {
                            date: vehicle.insuranceDate,
                            remaining: 7,
                            registration: vehicle.regNo,
                            vehicleType: vehicle.vehicleType,
                            model: vehicle.vModel,
                            //@ts-ignore
                            name: branch.branchAdmin.name
                        });
                        let payload = {
                            content: html,
                            subject: 'Vehicle licence notification',
                            //@ts-ignore
                            email: branch.branchAdmin.email
                        };
                        new mail_1.default().sendMail(payload);
                    });
                }.bind(null, vehicle._id));
                schedule.scheduleJob(new Date(thirdDate), function (id) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const html = yield resolve_template_1.getTemplate('licencenotice', {
                            date: vehicle.insuranceDate,
                            remaining: 1,
                            registration: vehicle.regNo,
                            vehicleType: vehicle.vehicleType,
                            model: vehicle.vModel,
                            //@ts-ignore
                            name: branch.branchAdmin.name
                        });
                        let payload = {
                            content: html,
                            subject: 'Vehicle licence notification',
                            //@ts-ignore
                            email: branch.branchAdmin.email
                        };
                        new mail_1.default().sendMail(payload);
                    });
                }.bind(null, vehicle._id));
                return Promise.resolve(vehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateVehicle(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { vehicleId } = data;
                let vehicle = yield this.vehicle.findById(vehicleId);
                if (!vehicle) {
                    throw new exceptions_1.BadInputFormatException('vehicle not found');
                }
                let branch = yield this.branch.findById(vehicle.branch).populate([
                    { path: 'branchAdmin', model: "User" }
                ]);
                let updatedVehicle = yield this.vehicle.findByIdAndUpdate(vehicle._id, { $set: data }, { new: true });
                if (data.insuranceDate) {
                    let date = new Date(data.insuranceDate);
                    let firstDate = date.setDate(date.getDate() - +14);
                    let secondDate = date.setDate(date.getDate() - +7);
                    let thirdDate = date.setDate(date.getDate() - +1);
                    schedule.scheduleJob(new Date(firstDate), function (id) {
                        return __awaiter(this, void 0, void 0, function* () {
                            const html = yield resolve_template_1.getTemplate('licencenotice', {
                                date: data.insuranceDate,
                                remaining: 14,
                                registration: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.regNo,
                                vehicleType: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.vehicleType,
                                model: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.vModel,
                                //@ts-ignore
                                name: branch === null || branch === void 0 ? void 0 : branch.branchAdmin.name
                            });
                            let payload = {
                                content: html,
                                subject: 'Vehicle licence notification',
                                //@ts-ignore
                                email: branch === null || branch === void 0 ? void 0 : branch.branchAdmin.email
                            };
                            new mail_1.default().sendMail(payload);
                        });
                    }.bind(null, updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle._id));
                    schedule.scheduleJob(new Date(secondDate), function (id) {
                        return __awaiter(this, void 0, void 0, function* () {
                            const html = yield resolve_template_1.getTemplate('licencenotice', {
                                date: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.insuranceDate,
                                remaining: 7,
                                registration: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.regNo,
                                vehicleType: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.vehicleType,
                                model: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.vModel,
                                //@ts-ignore
                                name: branch === null || branch === void 0 ? void 0 : branch.branchAdmin.name
                            });
                            let payload = {
                                content: html,
                                subject: 'Vehicle licence notification',
                                //@ts-ignore
                                email: branch === null || branch === void 0 ? void 0 : branch.branchAdmin.email
                            };
                            new mail_1.default().sendMail(payload);
                        });
                    }.bind(null, updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle._id));
                    schedule.scheduleJob(new Date(thirdDate), function (id) {
                        return __awaiter(this, void 0, void 0, function* () {
                            const html = yield resolve_template_1.getTemplate('licencenotice', {
                                date: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.insuranceDate,
                                remaining: 1,
                                registration: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.regNo,
                                vehicleType: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.vehicleType,
                                model: updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle.vModel,
                                //@ts-ignore
                                name: branch === null || branch === void 0 ? void 0 : branch.branchAdmin.name
                            });
                            let payload = {
                                content: html,
                                subject: 'Vehicle licence notification',
                                //@ts-ignore
                                email: branch === null || branch === void 0 ? void 0 : branch.branchAdmin.email
                            };
                            new mail_1.default().sendMail(payload);
                        });
                    }.bind(null, updatedVehicle === null || updatedVehicle === void 0 ? void 0 : updatedVehicle._id));
                }
                return Promise.resolve(updatedVehicle);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchVehicles(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const vehicles = yield this.vehicle.paginate({ branch: user.branch }, Object.assign({}, query));
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
                const vehicle = yield this.vehicle.findById(id).populate([
                    { path: 'assignedTo', model: 'User' },
                    { path: 'branch', model: 'branches' }
                ]);
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
                let approvalUser = yield this.user.findOne({ role: 'sales', subrole: 'head of department', branch: vehicle === null || vehicle === void 0 ? void 0 : vehicle.branch });
                yield new mail_1.default().push({
                    subject: "Vehicle inspection",
                    content: `A vehicle inspection request requires your approval. click to view ${static_1.default.FRONTEND_URL}/view-inspection-history/${vehicle === null || vehicle === void 0 ? void 0 : vehicle._id}`,
                    user: approvalUser
                });
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'vehicle Inspection',
                        activity: `You created an inspection request`,
                        time: new Date().toISOString()
                    }
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
                if (!vehicle) {
                    throw new exceptions_1.BadInputFormatException('this vehicle was not found');
                }
                //@ts-ignore
                let inspection = vehicle === null || vehicle === void 0 ? void 0 : vehicle.maintainace.filter(inspect => `${inspect._id}` == `${data.inspectionId}`);
                if (!inspection[0]) {
                    throw new exceptions_1.BadInputFormatException('maintainance request not found');
                }
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
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'vehicle Inspection',
                        activity: `You ${inspection[0].approvalStatus} an inspection request from ${vehicle.regNo}`,
                        time: new Date().toISOString()
                    }
                });
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
                let routePlan = new this.pickup(Object.assign(Object.assign({}, data), { branch: user.branch, vehicle: vehicle._id }));
                let availableRoutes = yield this.pickup.find({});
                routePlan.serialNo = availableRoutes.length + 1;
                if (routePlan.orderType == order_1.pickupType.CUSTOMER) {
                    if (routePlan.activity == vehicle_1.RouteActivity.PICKUP) {
                        let init = 'TECR';
                        let num = yield token_1.generateToken(6);
                        //@ts-ignore
                        let tecrNo = init + num.toString();
                        routePlan.tecrNo = tecrNo;
                    }
                    else if (routePlan.activity == vehicle_1.RouteActivity.DELIVERY) {
                        let init = 'TFCR';
                        let num = yield token_1.generateToken(6);
                        //@ts-ignore
                        let tfcrNo = init + num.toString();
                        routePlan.tfcrNo = tfcrNo;
                    }
                }
                else if (routePlan.orderType == order_1.pickupType.SUPPLIER) {
                    if (routePlan.activity == vehicle_1.RouteActivity.DELIVERY) {
                        let init = 'TECR';
                        let num = yield token_1.generateToken(6);
                        //@ts-ignore
                        let tecrNo = init + num.toString();
                        routePlan.tecrNo = tecrNo;
                    }
                    else if (routePlan.activity == vehicle_1.RouteActivity.PICKUP) {
                        let init = 'TFCR';
                        let num = yield token_1.generateToken(6);
                        //@ts-ignore
                        let tfcrNo = init + num.toString();
                        routePlan.tfcrNo = tfcrNo;
                    }
                }
                // console.log(routePlan);
                yield routePlan.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Route plan',
                        activity: `You added a route plan for ${vehicle.regNo}`,
                        time: new Date().toISOString()
                    }
                });
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
                const driver = yield this.user.findById(data.driver);
                //@ts-ignore
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.assignedTo = data.driver;
                //@ts-ignore
                driver === null || driver === void 0 ? void 0 : driver.vehicle = vehicle === null || vehicle === void 0 ? void 0 : vehicle._id;
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.comments.push({
                    //@ts-ignore
                    comment: data.comment,
                    commentBy: user._id
                });
                yield (vehicle === null || vehicle === void 0 ? void 0 : vehicle.save());
                yield (driver === null || driver === void 0 ? void 0 : driver.save());
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Assign driver',
                        activity: `You assigned ${driver === null || driver === void 0 ? void 0 : driver.name} to drive vehicle number ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.regNo}`,
                        time: new Date().toISOString()
                    }
                });
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
            ;
        });
    }
    fetchallVehicles(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const vehicles = yield this.vehicle.find({ branch: user.branch });
                return Promise.resolve(vehicles);
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
                const { vehicleId, query } = data;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'vehicle', model: 'vehicle' },
                        { path: 'security', model: 'User' },
                        { path: 'recievedBy', model: 'User' }
                    ] });
                //@ts-ignore
                const routePlan = yield this.pickup.paginate({ vehicle: `${vehicleId}`, deleted: false }, options);
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
                if ((pickup === null || pickup === void 0 ? void 0 : pickup.orderType) == order_1.pickupType.SUPPLIER && pickup.activity == vehicle_1.RouteActivity.DELIVERY) {
                    for (var cylinder of pickup.cylinders) {
                        let cyl = yield this.registerCylinder.findOne({ cylinderNumber: cylinder.cylinderNo });
                        //@ts-ignore
                        cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.SUPPLIER;
                        cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                            location: pickup.destination,
                            date: new Date().toISOString()
                        });
                        yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                    }
                }
                else if ((pickup === null || pickup === void 0 ? void 0 : pickup.orderType) == order_1.pickupType.CUSTOMER && pickup.activity == vehicle_1.RouteActivity.DELIVERY) {
                    for (var cylinder of pickup.cylinders) {
                        let cyl = yield this.registerCylinder.findOne({ cylinderNumber: cylinder.cylinderNo });
                        //@ts-ignore
                        cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.CUSTOMER;
                        cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                            location: pickup.destination,
                            date: new Date().toISOString()
                        });
                        yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                    }
                }
                else if ((pickup === null || pickup === void 0 ? void 0 : pickup.activity) == vehicle_1.RouteActivity.PICKUP) {
                    for (var cylinder of pickup.cylinders) {
                        let cyl = yield this.registerCylinder.findOne({ cylinderNumber: cylinder.cylinderNo });
                        //@ts-ignore
                        cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.ASNL;
                        cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                            location: pickup.destination,
                            date: new Date().toISOString()
                        });
                        yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                    }
                }
                //@ts-ignore
                pickup === null || pickup === void 0 ? void 0 : pickup.dateCompleted = new Date().toISOString();
                //@ts-ignore
                pickup === null || pickup === void 0 ? void 0 : pickup.status = status;
                yield (pickup === null || pickup === void 0 ? void 0 : pickup.save());
                return Promise.resolve(pickup);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchActivityLogs(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let user = yield this.user.findById(userId);
                const logs = yield this.activity.findOne({ user: user === null || user === void 0 ? void 0 : user._id });
                return Promise.resolve(logs);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Vehicle;
//# sourceMappingURL=index.js.map