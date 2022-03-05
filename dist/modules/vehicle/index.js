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
const cylinder_1 = require("../cylinder");
const emptyCylinder_1 = require("../../models/emptyCylinder");
class Vehicle extends module_1.default {
    constructor(props) {
        super();
        this.vehicle = props.vehicle;
        this.pickup = props.pickup;
        this.user = props.user;
        this.activity = props.activity;
        this.registerCylinder = props.registerCylinder;
        this.branch = props.branch;
        this.routeReport = props.routeReport;
        this.customer = props.customer;
        this.supplier = props.supplier;
        this.ecr = props.ecr;
        this.waybill = props.waybill;
        this.ocn = props.ocn;
        this.invoice = props.invoice;
        this.terretory = props.terretory;
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
                let updatedVehicle = yield this.vehicle.findByIdAndUpdate(vehicle._id, Object.assign({}, data), { new: true });
                // console.log(updatedVehicle);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, vehicleName, vehicleType, vehicleNumber, vehicleMake, vehicleModel, lastMileage } = query;
                const options = {
                    limit: query.limit || 10,
                    page: query.page || 1,
                    populate: [
                        { path: 'assignedTo', model: 'User' },
                        { path: 'branch', model: 'branches' }
                    ]
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (vehicleName) {
                    or.push({ vehicleType: new RegExp(vehicleName, 'gi') });
                }
                if (vehicleType) {
                    or.push({ vehicleType: new RegExp(vehicleType, 'gi') });
                }
                if (vehicleNumber) {
                    or.push({ regNo: new RegExp(vehicleNumber, 'gi') });
                }
                if (vehicleMake) {
                    or.push({ manufacturer: new RegExp(vehicleMake, 'gi') });
                }
                if (vehicleModel) {
                    or.push({ vModel: new RegExp(vehicleModel, 'gi') });
                }
                if (lastMileage) {
                    or.push({ lastMileage: new RegExp(lastMileage, 'gi') });
                }
                if (search) {
                    or.push({ lastMileage: new RegExp(search, 'gi') });
                    or.push({ vModel: new RegExp(search, 'gi') });
                    or.push({ manufacturer: new RegExp(search, 'gi') });
                    or.push({ regNo: new RegExp(search, 'gi') });
                    or.push({ vehicleType: new RegExp(search, 'gi') });
                    or.push({ vehicleName: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const vehicles = yield this.vehicle.paginate(q, options);
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
                    approvalStatus: vehicle_1.InspectApproval.PENDING,
                    analytics: data.analytics,
                    recomendedMech: data.recomendedMech,
                    referer: data.referer
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
                const vehicle = yield this.vehicle.findById(params.vehicleId).populate('assignedTo');
                if (!vehicle) {
                    throw new exceptions_1.BadInputFormatException('selected vehicle was not found please pick an available vehicle');
                }
                let routePlan = new this.pickup(Object.assign(Object.assign({}, data), { branch: user.branch, vehicle: vehicle._id }));
                let availableRoutes = yield this.pickup.find({}).sort({ serialNo: -1 }).limit(1);
                if (availableRoutes[0]) {
                    routePlan.serialNo = availableRoutes[0].serialNo + 1;
                }
                else {
                    routePlan.serialNo = 1;
                }
                const num = token_1.padLeft(routePlan.serialNo, 6, "");
                // const ecr = "ECR"+num;
                routePlan.rppNo = "RPP" + num;
                // routePlan.ecrNo = ecr;
                let failed = [];
                let routePlanCust = [];
                if (routePlan.orderType == order_1.pickupType.CUSTOMER) {
                    for (let cust of routePlan.customers) {
                        let checkCust = yield this.customer.findOne({ unique_id: cust.unique_id });
                        if (checkCust) {
                            routePlanCust.push(cust);
                        }
                        if (!checkCust) {
                            failed.push(cust);
                        }
                    }
                    routePlan.customers = routePlanCust;
                }
                if (routePlan.orderType == order_1.pickupType.SUPPLIER) {
                    for (let sup of routePlan.suppliers) {
                        let checkSupplier = yield this.supplier.findOne({ unique_id: sup.unique_id });
                        if (checkSupplier) {
                            routePlanCust.push(sup);
                        }
                        if (!checkSupplier) {
                            failed.push(sup);
                        }
                    }
                    routePlan.suppliers = routePlanCust;
                }
                if (routePlan.activity == vehicle_1.RouteActivity.DELIVERY) {
                    if (routePlan.orderType == order_1.pickupType.CUSTOMER) {
                        for (let plan of routePlan.customers) {
                            let delivery = yield this.waybill.findOne({ deliveryNo: plan.deliveryNo });
                            if (delivery) {
                                delivery.route_plan_id = routePlan._id;
                                yield delivery.save();
                            }
                        }
                    }
                    else if (routePlan.orderType == order_1.pickupType.SUPPLIER) {
                        for (let plan of routePlan.suppliers) {
                            let delivery = yield this.waybill.findOne({ deliveryNo: plan.deliveryNo });
                            if (delivery) {
                                delivery.route_plan_id = routePlan._id;
                                yield delivery.save();
                            }
                        }
                    }
                }
                yield routePlan.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Route plan',
                        activity: `You added a route plan for ${vehicle.regNo}`,
                        time: new Date().toISOString()
                    }
                });
                let message = failed.length > 0 ? `some ${routePlan.orderType}'s were not registered` : "Route record successful";
                return Promise.resolve({
                    route_plan: routePlan,
                    failed,
                    message
                });
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
                if (!vehicle) {
                    throw new exceptions_1.BadInputFormatException('vehicle not found');
                }
                else {
                    //@ts-ignore
                    vehicle.assignedTo = data.driver;
                }
                const driver = yield this.user.findById(data.driver);
                if (!driver) {
                    throw new exceptions_1.BadInputFormatException('driver not found');
                }
                else {
                    driver.vehicle = vehicle._id;
                }
                //@ts-ignore
                vehicle === null || vehicle === void 0 ? void 0 : vehicle.comments.push({
                    //@ts-ignore
                    comment: data.comment,
                    commentBy: user._id
                });
                yield vehicle.save();
                yield driver.save();
                console.log(driver);
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
                let ObjectId = cylinder_1.mongoose.Types.ObjectId;
                let { routeId, query } = data;
                //@ts-ignore
                let { email, supplier, customer, routeStatus } = query;
                console.log(routeId);
                let q = {
                    _id: routeId
                };
                let routePlan = yield this.pickup.findOne(q).populate([
                    { path: 'customer', model: 'customer' },
                    { path: 'supplier', model: 'supplier' },
                    { path: 'vehicle', model: 'vehicle', populate: {
                            path: 'assignedTo', model: "User"
                        } },
                    { path: "suppliers.cylinders", model: "registered-cylinders" },
                    { path: "customers.cylinders", model: "registered-cylinders" },
                    { path: 'security', model: 'User' },
                    { path: 'recievedBy', model: 'User' }
                ]);
                console.log(routePlan);
                if (!routePlan) {
                    throw new exceptions_1.BadInputFormatException('Not found');
                }
                if (routeStatus) {
                    if (routePlan.orderType == order_1.pickupType.CUSTOMER) {
                        let custs = routePlan.customers.filter(customer => customer.status == routeStatus);
                        routePlan.customers = custs;
                    }
                    else if (routePlan.orderType == order_1.pickupType.SUPPLIER) {
                        let supls = routePlan.suppliers.filter(supplier => supplier.status == routeStatus);
                        routePlan.suppliers = supls;
                    }
                }
                if (email) {
                    if (routePlan.orderType == order_1.pickupType.CUSTOMER) {
                        let custs = routePlan.customers.filter(customer => customer.unique_id == email);
                        routePlan.customers = custs;
                    }
                    else if (routePlan.orderType == order_1.pickupType.SUPPLIER) {
                        let supls = routePlan.suppliers.filter(supplier => supplier.unique_id == email);
                        routePlan.suppliers = supls;
                    }
                }
                return Promise.resolve(routePlan);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    vehicleRoutePlan(vehicleId, query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                let { driver, email, supplier, customer, search, fromDate, toDate, activity, orderType, routeStatus, status } = query;
                // console.log(orderType, routeStatus)
                let q = {
                    vehicle: `${vehicleId}`,
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ modeOfService: new RegExp(search, "gi") });
                }
                if (orderType == order_1.pickupType.SUPPLIER && email) {
                    //@ts-ignore
                    // q = {...q, 'customers.email': new RegExp(email, "gi")},
                    or.push({ 'suppliers.email': new RegExp(email, 'gi') });
                }
                if (orderType == order_1.pickupType.CUSTOMER && email) {
                    //@ts-ignore
                    // q = {...q, 'customers.email': new RegExp(email, "gi")},
                    or.push({ 'customers.email': new RegExp(email, "gi") });
                }
                if (supplier) {
                    //@ts-ignore
                    // q ={...q,'suppliers.name': new RegExp(supplier, "gi")}
                    or.push({ 'suppliers.name': new RegExp(supplier, "gi") });
                }
                if (routeStatus) {
                    //@ts-ignore
                    // q ={...q,'customers.status': routeStatus}
                    or.push({ 'customers.status': new RegExp(routeStatus, 'gi') });
                    or.push({ 'suppliers.status': new RegExp(routeStatus, 'gi') });
                }
                if (customer === null || customer === void 0 ? void 0 : customer.length) {
                    //@ts-ignore
                    // q = {...q, 'customers.name': new RegExp(customer, "gi")}
                    or.push({ 'customers.name': new RegExp(customer, "gi") });
                }
                if (activity === null || activity === void 0 ? void 0 : activity.length) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'activity': activity });
                    // or.push({'activity': new RegExp(activity, "gi")})
                }
                if (orderType) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'orderType': orderType });
                    // or.push({'orderType': new RegExp(pickupType, "gi")})
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $gte: new Date(fromDate) } });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $lte: new Date(toDate) } });
                }
                if (status) {
                    or.push({ 'status': new RegExp(status, 'gi') });
                }
                // console.log(q)
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                const options = {
                    page: (query === null || query === void 0 ? void 0 : query.page) || 1,
                    limit: (query === null || query === void 0 ? void 0 : query.limit) || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: "suppliers.cylinders", model: "registered-cylinders" },
                        { path: "customers.cylinders", model: "registered-cylinders" },
                        { path: 'vehicle', model: 'vehicle', populate: {
                                path: 'assignedTo', model: "User"
                            } },
                        { path: 'security', model: 'User' },
                        { path: 'recievedBy', model: 'User' }
                    ],
                    sort: { createdAt: -1 }
                };
                //@ts-ignore
                let v = yield this.pickup.paginate(q, options);
                // .populate([
                //   {path:'customer', model:'customer'},
                //   {path:'supplier', model:'supplier'},
                //   {path:"suppliers.cylinders", model:"registered-cylinders"},
                //   {path:"customers.cylinders", model:"registered-cylinders"},
                //   {path:'vehicle', model:'vehicle',populate:{
                //     path:'assignedTo', model:"User"
                //   }},
                //   {path:'security', model:'User'},
                //   {path:'recievedBy', model:'User'}
                // ]);
                return Promise.resolve(v);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    RoutePlans(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                let { driver, email, supplier, customer, search, fromDate, toDate, activity, pickupType } = query;
                let q = {
                    branch: user.branch,
                };
                let or = [];
                if (search) {
                    or.push({ modeOfService: new RegExp(search || "", "gi") });
                }
                if (email) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'customers.email': new RegExp(email, "gi") });
                }
                if (email && customer) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'customers.email': new RegExp(email, "gi"), 'customers.name': new RegExp(customer, "gi") });
                }
                if (email && supplier) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'suppliers.email': new RegExp(email, "gi"), 'suppliers.name': new RegExp(supplier, "gi") });
                }
                if (supplier === null || supplier === void 0 ? void 0 : supplier.length) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'suppliers.name': new RegExp(supplier, "gi") });
                }
                if (customer === null || customer === void 0 ? void 0 : customer.length) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'customers.name': new RegExp(customer, "gi") });
                }
                if (activity === null || activity === void 0 ? void 0 : activity.length) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'activity': new RegExp(activity, "gi") });
                }
                if (pickupType === null || pickupType === void 0 ? void 0 : pickupType.length) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'orderType': new RegExp(pickupType, "gi") });
                }
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $gte: new Date(fromDate) } });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $lte: new Date(toDate) } });
                }
                // console.log(q)
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                const options = {
                    page: (query === null || query === void 0 ? void 0 : query.page) || 1,
                    limit: (query === null || query === void 0 ? void 0 : query.limit) || 10,
                    populate: [
                        { path: 'customer', model: 'customer' },
                        { path: 'supplier', model: 'supplier' },
                        { path: 'vehicle', model: 'vehicle', populate: {
                                path: 'assignedTo', model: "User"
                            } },
                        { path: 'security', model: 'User' },
                        { path: 'recievedBy', model: 'User' }
                    ],
                    sort: { createdAt: -1 }
                };
                //@ts-ignore
                let v = yield this.pickup.paginate(q, options);
                return Promise.resolve(v);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    startRoute(routeId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(data, routeId);
                const plan = yield this.pickup.findById(routeId).populate({
                    path: 'vehicle', model: 'vehicle', populate: {
                        path: 'assignedTo', model: 'User'
                    }
                });
                if (!plan) {
                    throw new exceptions_1.BadInputFormatException('No Routeplan found for this Id');
                }
                if ((plan === null || plan === void 0 ? void 0 : plan.orderType) == order_1.pickupType.SUPPLIER) {
                    if (plan.suppliers.length > 0) {
                        for (let supplier of plan.suppliers) {
                            if (supplier.unique_id == data.customer_unique_id) {
                                let payload = {
                                    vehicle: plan.vehicle,
                                    dateStarted: new Date().toISOString(),
                                    departure: data.departure,
                                    client: supplier.name,
                                    destination: supplier.destination,
                                    mileageIn: data.mileIn,
                                    //@ts-ignore
                                    driver: plan.vehicle.assignedTo.name,
                                    routeInfo: plan._id
                                };
                                let routeReport = yield this.routeReport.create(payload);
                                //@ts-ignore
                                supplier.status = vehicle_1.RoutePlanStatus.PROGRESS;
                                supplier.reportId = routeReport._id;
                            }
                        }
                    }
                }
                else if (plan.orderType == order_1.pickupType.CUSTOMER) {
                    if (plan.customers.length > 0) {
                        for (let customer of plan.customers) {
                            if (customer.unique_id == data.customer_unique_id) {
                                let payload = {
                                    vehicle: plan.vehicle,
                                    dateStarted: new Date().toISOString(),
                                    departure: data.departure,
                                    destination: customer.destination,
                                    client: customer.name,
                                    //@ts-ignore
                                    driver: plan.vehicle.assignedTo.name,
                                    routeInfo: plan._id,
                                    timeIn: new Date().getTime()
                                };
                                let routeReport = yield this.routeReport.create(payload);
                                //@ts-ignore
                                customer.status = vehicle_1.RoutePlanStatus.PROGRESS;
                                customer.reportId = routeReport._id;
                            }
                        }
                    }
                }
                yield plan.save();
                return Promise.resolve(plan);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    markRouteAsComplete(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // console.log(user)
                const { query, ecrData, routeId } = data;
                // console.log(data)
                //@ts-ignore
                const { name, customer_uniqe_id, deliveryNo } = query;
                let TECR = '';
                const pickup = yield this.pickup.findById(routeId);
                if (!pickup) {
                    throw new exceptions_1.BadInputFormatException('Route Plan not found');
                }
                let routeReport = yield this.routeReport.findOne({ routeInfo: pickup === null || pickup === void 0 ? void 0 : pickup._id });
                if (!routeReport) {
                    throw new exceptions_1.BadInputFormatException('this route has not been started and thus cannot be marked as complete');
                }
                if ((pickup === null || pickup === void 0 ? void 0 : pickup.orderType) == order_1.pickupType.SUPPLIER && pickup.activity == vehicle_1.RouteActivity.DELIVERY) {
                    if (pickup.suppliers.length > 0) {
                        for (let supplier of pickup.suppliers) {
                            if (supplier.unique_id == customer_uniqe_id) {
                                if (supplier.deliveryNo == deliveryNo) {
                                    if (supplier.cylinders.length > 0) {
                                        for (let cylinder of supplier.cylinders) {
                                            let cyl = yield this.registerCylinder.findById(cylinder);
                                            //@ts-ignore
                                            cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.SUPPLIER;
                                            //@ts-ignore
                                            cyl === null || cyl === void 0 ? void 0 : cyl.supplierType = supplier.supplierType;
                                            cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                                                heldBy: "supplier",
                                                //@ts-ignore
                                                name: supplier.name,
                                                location: supplier.destination,
                                                date: new Date().toISOString()
                                            });
                                            yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                                        }
                                    }
                                    //@ts-ignore
                                    supplier.status = vehicle_1.RoutePlanStatus.DONE;
                                    let routeReport = yield this.routeReport.findById(supplier.reportId);
                                    //@ts-ignore
                                    routeReport === null || routeReport === void 0 ? void 0 : routeReport.dateCompleted = new Date().toISOString();
                                    //@ts-ignore
                                    routeReport === null || routeReport === void 0 ? void 0 : routeReport.timeOut = new Date().getTime();
                                    //@ts-ignore
                                    routeReport === null || routeReport === void 0 ? void 0 : routeReport.mileageOut = data.mileageOut;
                                }
                            }
                        }
                    }
                }
                else if ((pickup === null || pickup === void 0 ? void 0 : pickup.orderType) == order_1.pickupType.CUSTOMER && pickup.activity == vehicle_1.RouteActivity.DELIVERY) {
                    if (pickup.customers.length > 0) {
                        // console.log(email, deliveryNo)
                        for (let customer of pickup.customers) {
                            if (customer.unique_id == customer_uniqe_id) {
                                if (customer.deliveryNo == deliveryNo) {
                                    console.log(customer_uniqe_id, deliveryNo);
                                    if (customer.cylinders.length > 0) {
                                        for (let cylinder of customer.cylinders) {
                                            let cyl = yield this.registerCylinder.findById(cylinder);
                                            //@ts-ignore
                                            cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.CUSTOMER;
                                            cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                                                heldBy: "customer",
                                                name: customer.name,
                                                location: customer.destination,
                                                date: new Date().toISOString()
                                            });
                                            yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                                        }
                                    }
                                    //@ts-ignore
                                    customer.status = vehicle_1.RoutePlanStatus.DONE;
                                    let routeReport = yield this.routeReport.findById(customer.reportId);
                                    //@ts-ignore
                                    routeReport === null || routeReport === void 0 ? void 0 : routeReport.dateCompleted = new Date().toISOString();
                                    //@ts-ignore
                                    routeReport === null || routeReport === void 0 ? void 0 : routeReport.mileageOut = data.mileageOut;
                                    //@ts-ignore
                                    routeReport === null || routeReport === void 0 ? void 0 : routeReport.timeOut = new Date().getTime();
                                }
                            }
                        }
                    }
                }
                else if ((pickup === null || pickup === void 0 ? void 0 : pickup.activity) == vehicle_1.RouteActivity.PICKUP && (pickup === null || pickup === void 0 ? void 0 : pickup.orderType) == order_1.pickupType.CUSTOMER) {
                    if (pickup.customers.length > 0) {
                        for (let customer of pickup.customers) {
                            if (customer.unique_id == `${customer_uniqe_id}`) {
                                if (customer.cylinders.length > 0) {
                                    for (let cylinder of customer.cylinders) {
                                        let cyl = yield this.registerCylinder.findById(cylinder);
                                        //@ts-ignore
                                        cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.ASNL;
                                        cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                                            heldBy: "asnl",
                                            name: "ASNL",
                                            location: customer.destination,
                                            date: new Date().toISOString()
                                        });
                                        yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                                    }
                                }
                                //@ts-ignore
                                customer.status = vehicle_1.RoutePlanStatus.DONE;
                                customer.tecrNo = pickup.tecrNo;
                                let routeReport = yield this.routeReport.findById(customer.reportId);
                                //@ts-ignore
                                routeReport === null || routeReport === void 0 ? void 0 : routeReport.dateCompleted = new Date().toISOString();
                                //@ts-ignore
                                routeReport === null || routeReport === void 0 ? void 0 : routeReport.mileageOut = data.mileageOut;
                                //@ts-ignore
                                routeReport === null || routeReport === void 0 ? void 0 : routeReport.timeOut = new Date().getTime();
                                //TO-DO create tecr
                                let { ecrNo } = yield this.createTecr({
                                    customer,
                                    ecrData
                                }, user);
                                // console.log(ecr)
                                TECR = ecrNo;
                            }
                        }
                    }
                }
                else if ((pickup === null || pickup === void 0 ? void 0 : pickup.activity) == vehicle_1.RouteActivity.PICKUP && (pickup === null || pickup === void 0 ? void 0 : pickup.orderType) == order_1.pickupType.SUPPLIER) {
                    if (pickup.suppliers.length > 0) {
                        for (let supplier of pickup.suppliers) {
                            if (supplier.unique_id == `${customer_uniqe_id}`) {
                                if (supplier.cylinders.length > 0) {
                                    for (let cylinder of supplier.cylinders) {
                                        let cyl = yield this.registerCylinder.findById(cylinder);
                                        //@ts-ignore
                                        cyl === null || cyl === void 0 ? void 0 : cyl.holder = registeredCylinders_1.cylinderHolder.ASNL;
                                        cyl === null || cyl === void 0 ? void 0 : cyl.tracking.push({
                                            heldBy: "supplier",
                                            //@ts-ignore
                                            name: supplier.name,
                                            location: supplier.destination,
                                            date: new Date().toISOString()
                                        });
                                        yield (cyl === null || cyl === void 0 ? void 0 : cyl.save());
                                    }
                                }
                                //@ts-ignore
                                supplier.status = vehicle_1.RoutePlanStatus.DONE;
                                supplier.tfcrNo = pickup.tfcrNo;
                                let routeReport = yield this.routeReport.findById(supplier.reportId);
                                //@ts-ignore
                                routeReport === null || routeReport === void 0 ? void 0 : routeReport.dateCompleted = new Date().toISOString();
                                //@ts-ignore
                                routeReport === null || routeReport === void 0 ? void 0 : routeReport.mileageOut = data.mileageOut;
                                //@ts-ignore
                                routeReport === null || routeReport === void 0 ? void 0 : routeReport.timeOut = new Date().getTime();
                                let { ecrNo } = yield this.createTecr({
                                    supplier,
                                    ecrData
                                }, user);
                                // console.log(ecr)
                                TECR = ecrNo;
                            }
                        }
                    }
                }
                yield (pickup === null || pickup === void 0 ? void 0 : pickup.save());
                yield routeReport.save();
                return Promise.resolve({
                    pickup,
                    tecr: TECR,
                    message: `An otp has been sent to the customer`
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    createTecr(data, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { customer, supplier, ecrData } = data;
                let responseData;
                if (customer) {
                    let cust = yield this.customer.findOne({ email: customer.email });
                    let ecr = new this.ecr(Object.assign({}, ecrData));
                    let available = yield this.ecr.find({}).sort({ initNum: -1 }).limit(1);
                    if (available[0]) {
                        //@ts-ignore
                        ecr.initNum = available[0].initNum + 1;
                    }
                    else {
                        ecr.initNum = 1;
                    }
                    if (cust) {
                        ecr.customer = cust._id;
                    }
                    ecr.priority = emptyCylinder_1.Priority.TRUCK;
                    ecr.type = emptyCylinder_1.EcrType.TRUCK;
                    ecr.status = emptyCylinder_1.EcrApproval.TRUCK;
                    ecr.position = emptyCylinder_1.ProductionSchedule.TRUCK;
                    ecr.branch = user.branch;
                    ecr.initiator = user._id;
                    //@ts-ignore
                    let totalC = ecr.cylinders.length + ((_a = ecr.fringeCylinders) === null || _a === void 0 ? void 0 : _a.length);
                    ecr.totalQuantity = totalC.toString();
                    let num = token_1.padLeft(ecr.initNum, 6, "");
                    const ecrN = "TECR" + num;
                    let otp = Math.floor(1000 + Math.random() * 9000);
                    ecr.otp = otp.toString();
                    ecr.ecrNo = ecrN;
                    yield ecr.save();
                    responseData = ecr;
                    let number = token_1.parsePhoneNumberToStandard(ecr.recieversPhone);
                    console.log(number);
                    new mail_1.default().sendSMSTermii({
                        message: `complete the TECR with OTP:${otp}, Tecr number:${ecr.ecrNo} `,
                        to: `${number.to}`
                    });
                }
                else if (supplier) {
                    let suppl = yield this.supplier.findOne({ email: supplier.email });
                    let ecr = new this.ecr(Object.assign({}, ecrData));
                    let available = yield this.ecr.find({}).sort({ initNum: -1 }).limit(1);
                    if (available[0]) {
                        //@ts-ignore
                        ecr.initNum = available[0].initNum + 1;
                    }
                    else {
                        ecr.initNum = 1;
                    }
                    if (suppl) {
                        ecr.supplier = suppl._id;
                    }
                    ecr.priority = emptyCylinder_1.Priority.TRUCK;
                    ecr.type = emptyCylinder_1.EcrType.TRUCK;
                    ecr.status = emptyCylinder_1.EcrApproval.TRUCK;
                    ecr.position = emptyCylinder_1.ProductionSchedule.TRUCK;
                    ecr.branch = user.branch;
                    ecr.initiator = user._id;
                    let num = token_1.padLeft(ecr.initNum, 6, "");
                    const ecrN = "TFCR" + num;
                    let otp = Math.floor(1000 + Math.random() * 9000);
                    ecr.otp = otp.toString();
                    ecr.ecrNo = ecrN;
                    yield ecr.save();
                    responseData = ecr;
                    let number = token_1.parsePhoneNumberToStandard(ecr.recieversPhone);
                    new mail_1.default().sendSMSTermii({
                        message: `complete the TECR with OTP:${otp}, Tecr number:${ecr.ecrNo}`,
                        to: `${number.to}`
                    });
                }
                return responseData;
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    marAsCompletedRoutePlan(routeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let routePlan = yield this.pickup.findById(routeId);
                if (!routePlan) {
                    throw new exceptions_1.BadInputFormatException('routePlan not found');
                }
                routePlan.status = vehicle_1.RoutePlanStatus.DONE;
                yield routePlan.save();
                return routePlan;
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
                //@ts-ignore
                logs === null || logs === void 0 ? void 0 : logs.activities.sort((a, b) => b.createdAt - a.createdAt);
                return Promise.resolve(logs);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchVehiclePerformance(query, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                let { search, filter, fromDate, toDate, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    sort: { createdAt: -1 }
                };
                let q = {
                    vehicle: vehicleId
                };
                let or = [];
                if (fromDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { dateCompleted: { '$gte': new Date(fromDate) } });
                }
                if (toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { dateCompleted: { '$lte': new Date(toDate) } });
                }
                if (search) {
                    or.push({ client: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const performance = yield this.routeReport.paginate(q, options);
                return Promise.resolve(performance);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    genWaybill(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let delivery = new this.waybill(Object.assign(Object.assign({}, data), { branch: user.branch }));
                let dn = yield this.waybill.find({}).sort({ numInit: -1 }).limit(1);
                let wbNo;
                if (dn[0]) {
                    wbNo = dn[0].numInit + 1;
                }
                else {
                    wbNo = 1;
                }
                let deliveryNo = token_1.padLeft(wbNo, 6, '');
                delivery.deliveryNo = "D" + deliveryNo;
                delivery.numInit = wbNo;
                let invoice = yield this.invoice.findById(delivery.invoice_id);
                if (invoice) {
                    invoice.delivery_id = delivery._id;
                    yield invoice.save();
                }
                yield delivery.save();
                return Promise.resolve(delivery);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchWaybills(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { search, page, limit } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'branch', model: 'branches' },
                        { path: 'ocn', model: 'out-going-cylinders' },
                        { path: 'customer.id', model: 'customer' },
                    ],
                    sort: { createdAt: -1 }
                };
                let q = {
                    branch: user.branch,
                    route_plan_id: null
                };
                console.log(q);
                let or = [];
                if (search) {
                    or.push({ customer: new RegExp(search, 'gi') });
                    or.push({ 'cylinders.cylinderNo': new RegExp(search, 'gi') });
                    or.push({ invoiceNo: new RegExp(search, 'gi') });
                    or.push({ deliveryType: new RegExp(search, 'gi') });
                    or.push({ lpoNo: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                let delivery = yield this.waybill.paginate(q, options);
                return Promise.resolve(delivery);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDeliveryDetails(deliveryId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let delivery = yield this.waybill.findById(deliveryId).populate([
                    { path: 'branch', model: 'branches' },
                    { path: 'ocn', model: 'out-going-cylinders' },
                    { path: 'customer.id', model: 'customer' },
                    { path: "cylinders", model: "registered-cylinders" }
                ]);
                return Promise.resolve(delivery);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    addTerritory(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let ft = yield this.terretory.findOne({ name: data.name });
                if (ft) {
                    throw new exceptions_1.BadInputFormatException('a terretory with this name already exists');
                }
                const terretory = yield this.terretory.create(Object.assign(Object.assign({}, data), { branch: user.branch }));
                return terretory;
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
    fetchTerritory(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { search } = query;
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ name: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                const terretories = yield this.terretory.find(q).populate({
                    path: 'branch', model: "branches", select: 'name location'
                });
                return terretories;
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
    deleteTerretory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.terretory.findByIdAndRemove(id);
                return 'Oppereation successful';
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
}
exports.default = Vehicle;
//# sourceMappingURL=index.js.map