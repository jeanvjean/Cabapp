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
const receivedProduct_1 = require("../../models/receivedProduct");
const transferCylinder_1 = require("../../models/transferCylinder");
const resolve_template_1 = require("../../util/resolve-template");
const token_1 = require("../../util/token");
const module_1 = require("../module");
const static_1 = require("../../configs/static");
const mail_1 = require("../../util/mail");
const logs_1 = require("../../util/logs");
class Product extends module_1.default {
    constructor(props) {
        super();
        this.product = props.product;
        this.supplier = props.supplier;
        this.inventory = props.inventory;
        this.disburse = props.disburse;
        this.branch = props.branch;
        this.user = props.user;
    }
    createBranch(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                let checkEmail = yield this.user.findOne({ email: data.branchAdmin });
                if (checkEmail) {
                    throw new exceptions_1.BadInputFormatException('this email already exists on the platform!! please check the email and try again');
                }
                const newUser = new this.user({ email: data.branchAdmin, role: 'admin', subrole: 'superadmin' });
                const branch = new this.branch(Object.assign(Object.assign({}, data), { branchAdmin: newUser._id }));
                newUser.branch = branch._id;
                branch === null || branch === void 0 ? void 0 : branch.officers.push(newUser._id);
                let password = yield token_1.generateToken(4);
                //@ts-ignore
                newUser.password = password;
                yield newUser.save();
                yield branch.save();
                const html = yield resolve_template_1.getTemplate('invite', {
                    team: newUser.role,
                    role: newUser.subrole,
                    link: static_1.default.FRONTEND_URL,
                    branch: branch.name,
                    password
                });
                let mailLoad = {
                    content: html,
                    subject: 'New User registeration',
                    email: newUser.email,
                };
                new mail_1.default().sendMail(mailLoad);
                return Promise.resolve(branch);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchBranches(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const branches = yield this.branch.paginate({}, Object.assign({}, query));
                return Promise.resolve(branches);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    createProduct(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let findProduct = yield this.product.findOne({ asnlNumber: data.asnlNumber, branch: user.branch });
                if (findProduct) {
                    throw new exceptions_1.BadInputFormatException('a product with this ASNL number already exists in your branch');
                }
                let product = new this.product(Object.assign({}, data));
                let findP = yield this.product.find({});
                product.serialNumber = findP.length + 1;
                product.branch = user.branch;
                // const branch = await this.branch.findById(user.branch);
                // branch?.products.push(product._id);
                yield product.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Inventory',
                        //@ts-ignore
                        activity: `You Added a new product to product list`,
                        time: new Date().toISOString()
                    }
                });
                return Promise.resolve(product);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchProducts(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const products = yield this.product.paginate({ branch: user.branch, deleted: false }, Object.assign({}, query));
                // console.log(products);
                return Promise.resolve(products);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchProduct(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.product.findById(id).populate({ path: 'supplier', model: 'supplier' }, { path: 'branch', model: 'branches' });
                return Promise.resolve(product);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateProduct(productId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.product.findByIdAndUpdate(productId, {
                    $set: data
                }, { new: true
                });
                return Promise.resolve(product);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteProduct(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield this.product.findById(productId);
                if (!product) {
                    throw new exceptions_1.BadInputFormatException('product not found');
                }
                product.deleted = true;
                return Promise.resolve({
                    message: 'Product deleted'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    inventoryStats(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inventories = yield this.inventory.find({ branch: user.branch });
                const issuedOut = inventories.filter(inventory => inventory.direction == receivedProduct_1.productDirection.OUT);
                const totalProducts = yield this.product.find({ branch: user.branch });
                let p1Name = totalProducts[0].productName;
                let p1Qty = 0;
                let p1totalInstock = totalProducts[0].quantity;
                for (let prod of issuedOut) {
                    for (let p of prod.products) {
                        if (p.productName == p1Name) {
                            p1Qty += +p.quantity;
                        }
                    }
                }
                let p2Name = totalProducts[1].productName;
                let p2Qty = 0;
                let p2totalInstock = totalProducts[1].quantity;
                for (let prod of issuedOut) {
                    for (let p of prod.products) {
                        if (p.productName == p2Name) {
                            p2Qty += +p.quantity;
                        }
                    }
                }
                let p3Name = totalProducts[1].productName;
                let p3Qty = 0;
                let p3totalInstock = totalProducts[1].quantity;
                for (let prod of issuedOut) {
                    for (let p of prod.products) {
                        if (p.productName == p3Name) {
                            p3Qty += +p.quantity;
                        }
                    }
                }
                return Promise.resolve({
                    product1: {
                        name: p1Name,
                        quantityInStock: p1totalInstock,
                        issuedOut: p1Qty
                    },
                    product2: {
                        name: p2Name,
                        quantityInStock: p2totalInstock,
                        issuedOut: p2Qty
                    },
                    product3: {
                        name: p3Name,
                        quantityInStock: p3totalInstock,
                        issuedOut: p3Qty
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    createSupplier(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supplier = yield this.supplier.create(Object.assign(Object.assign({}, data), { branch: user.branch }));
                return Promise.resolve(supplier);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchSuppliers(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const suppliers = yield this.supplier.paginate({ branch: user.branch }, Object.assign({}, query));
                return Promise.resolve(suppliers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchSupplierDetails(supplierId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supplier = yield this.supplier.findById(supplierId).populate([
                    { path: 'branch', model: 'branches' },
                ]);
                return Promise.resolve(supplier);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateSupplier(supplierId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supplier = yield this.supplier.findByIdAndUpdate(supplierId, { $set: data }, { new: true });
                return Promise.resolve(supplier);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    removeSupplier(supplierId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supplier = yield this.supplier.findById(supplierId);
                if (!supplier) {
                    throw new exceptions_1.BadInputFormatException('Supplier not found');
                }
                yield supplier.remove();
                return Promise.resolve({
                    message: 'deleted successfully'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    addInventory(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inventory = new this.inventory(Object.assign(Object.assign({}, data), { inspectingOfficer: user._id, branch: user.branch }));
                let products = inventory.products;
                if (inventory.direction == receivedProduct_1.productDirection.IN) {
                    for (let product of products) {
                        let prod = yield this.product.findOne({ asnlNumber: product.productNumber, branch: user.branch });
                        //@ts-ignore
                        prod === null || prod === void 0 ? void 0 : prod.quantity += +product.passed;
                        //@ts-ignore
                        prod === null || prod === void 0 ? void 0 : prod.totalCost = (prod === null || prod === void 0 ? void 0 : prod.unitCost) * (prod === null || prod === void 0 ? void 0 : prod.quantity);
                        //@ts-ignore
                        yield (prod === null || prod === void 0 ? void 0 : prod.save());
                    }
                    yield logs_1.createLog({
                        user: user._id,
                        activities: {
                            title: 'Inventory',
                            //@ts-ignore
                            activity: `You recorded new inventories coming in`,
                            time: new Date().toISOString()
                        }
                    });
                }
                else if (inventory.direction == receivedProduct_1.productDirection.OUT) {
                    for (let product of products) {
                        let prod = yield this.product.findOne({ asnlNumber: product.productNumber, branch: user.branch });
                        //@ts-ignore
                        prod === null || prod === void 0 ? void 0 : prod.quantity -= +product.quantity;
                        //@ts-ignore
                        prod === null || prod === void 0 ? void 0 : prod.totalCost = (prod === null || prod === void 0 ? void 0 : prod.unitCost) * (prod === null || prod === void 0 ? void 0 : prod.quantity);
                        //@ts-ignore
                        yield (prod === null || prod === void 0 ? void 0 : prod.save());
                    }
                    yield logs_1.createLog({
                        user: user._id,
                        activities: {
                            title: 'Inventory',
                            //@ts-ignore
                            activity: `You recorded new inventories going out`,
                            time: new Date().toISOString()
                        }
                    });
                }
                yield inventory.save();
                return Promise.resolve(inventory);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchAllProducts(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield this.product.find({ branch: user.branch });
                return Promise.resolve(products);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchInventories(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const inventories = yield this.inventory.paginate({ branch: user.branch }, Object.assign({}, query));
                //@ts-ignore
                const issuedOut = yield this.inventory.paginate({ branch: user.branch, direction: receivedProduct_1.productDirection.OUT }, Object.assign({}, query));
                //@ts-ignore
                const recieved = yield this.inventory.paginate({ branch: user.branch, direction: receivedProduct_1.productDirection.IN }, Object.assign({}, query));
                return Promise.resolve({
                    inventory: inventories,
                    issuedOut,
                    recieved
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    viewInventory(inventoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inventory = yield this.inventory.findById(inventoryId);
                return Promise.resolve(inventory);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    disburseProduct(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let hod = yield this.user.findOne({
                    role: user.role,
                    subrole: 'head of department',
                    branch: user.branch
                });
                const disbursement = new this.disburse(Object.assign(Object.assign({}, data), { nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id, initiator: user._id, branch: user.branch }));
                let track = {
                    title: "initiate disbursal process",
                    stage: transferCylinder_1.stagesOfApproval.STAGE1,
                    status: transferCylinder_1.ApprovalStatus.APPROVED,
                    approvalOfficer: user._id
                };
                disbursement.tracking.push(track);
                disbursement.approvalOfficers.push({
                    name: user.name,
                    id: user._id,
                    office: user.subrole,
                    department: user.role,
                    stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                });
                disbursement.requestApproval = transferCylinder_1.TransferStatus.PENDING;
                disbursement.requestStage = transferCylinder_1.stagesOfApproval.STAGE1;
                disbursement.comments.push({
                    comment: data.comment,
                    commentBy: user._id
                });
                yield disbursement.save();
                yield logs_1.createLog({
                    user: user._id,
                    activities: {
                        title: 'Product disbursal',
                        //@ts-ignore
                        activity: `You started a product disbursal process`,
                        time: new Date().toISOString()
                    }
                });
                let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                yield new mail_1.default().push({
                    subject: "Product disbursal",
                    content: `A disbursal process has been initiated and requires your approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                    user: apUser
                });
                return Promise.resolve(disbursement);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveDisbursment(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let loginUser = yield this.user.findById(user._id).select('+password');
                let matchPWD = yield (loginUser === null || loginUser === void 0 ? void 0 : loginUser.comparePWD(data.password, user.password));
                if (!matchPWD) {
                    throw new exceptions_1.BadInputFormatException('Incorrect password... please check the password');
                }
                const disbursement = yield this.disburse.findById(data.id).populate({
                    path: 'initiator', model: 'User'
                });
                if (!disbursement) {
                    throw new exceptions_1.BadInputFormatException('product disbursal not found');
                }
                //@ts-ignore
                disbursement === null || disbursement === void 0 ? void 0 : disbursement.products = data.products;
                if (data.releasedTo !== null && data.releasedBy !== null) {
                    //@ts-ignore
                    disbursement === null || disbursement === void 0 ? void 0 : disbursement.releasedBy = data.releasedBy;
                    //@ts-ignore
                    disbursement === null || disbursement === void 0 ? void 0 : disbursement.releasedTo = data.releasedTo;
                }
                yield (disbursement === null || disbursement === void 0 ? void 0 : disbursement.save());
                if (data.status == transferCylinder_1.ApprovalStatus.REJECTED) {
                    if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = disbursement.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Corrections",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            approvalOfficer: AO[0].id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        disbursement.tracking.push(track);
                        disbursement.nextApprovalOfficer = AO[0].id;
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = disbursement.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Corrections",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            approvalOfficer: AO[0].id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        disbursement.nextApprovalOfficer = AO[0].id;
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.requestStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let AO = disbursement.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Corrections",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            approvalOfficer: AO[0].id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        disbursement.tracking.push(track);
                        disbursement.requestStage = transferCylinder_1.stagesOfApproval.START;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        disbursement.nextApprovalOfficer = AO[0].id;
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.requestStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let AO = disbursement.approvalOfficers.filter(officer => officer.stageOfApproval == transferCylinder_1.stagesOfApproval.STAGE1);
                        let track = {
                            title: "Corrections",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.REJECTED,
                            approvalOfficer: AO[0].id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        disbursement.tracking.push(track);
                        disbursement.requestStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        disbursement.nextApprovalOfficer = AO[0].id;
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Rejected a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                }
                else {
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.START) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod._id;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Approved a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            //@ts-ignore
                            nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = hod === null || hod === void 0 ? void 0 : hod.branch.branchAdmin;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Approved a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        disbursement.disburseStatus = transferCylinder_1.TransferStatus.COMPLETED;
                        // for(let product of disbursement.products) {
                        //   let pro = await this.product.findOne({asnlNumber:product.productNumber, branch:user.branch});
                        //   //@ts-ignore
                        //   pro?.quantity -= +product.quantityReleased;
                        //   await pro?.save();
                        // }
                        //@ts-ignore
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Approved a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.initiator);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `product disbursal request has been approved. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.requestStage) == transferCylinder_1.stagesOfApproval.START) {
                        //@ts-ignore
                        const branchApproval = yield this.user.findOne({ role: user.role, subrole: 'head of department', branch: user.role });
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE1,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: branchApproval === null || branchApproval === void 0 ? void 0 : branchApproval._id
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE1
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.requestStage = transferCylinder_1.stagesOfApproval.STAGE1;
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = branchApproval === null || branchApproval === void 0 ? void 0 : branchApproval._id;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Approved a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal request initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.requestStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let brenchRequestApproval = yield this.user.findOne({ branch: user.branch, subrole: 'head of department' }).populate({
                            path: 'branch', model: 'branches'
                        });
                        // console.log(brenchRequestApproval)
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            //@ts-ignore
                            nextApprovalOfficer: brenchRequestApproval === null || brenchRequestApproval === void 0 ? void 0 : brenchRequestApproval.branch.branchAdmin
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE2
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.requestStage = transferCylinder_1.stagesOfApproval.STAGE2;
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = brenchRequestApproval === null || brenchRequestApproval === void 0 ? void 0 : brenchRequestApproval.branch.branchAdmin;
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Approved a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal request has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.requestStage) == transferCylinder_1.stagesOfApproval.STAGE2) {
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE3,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            nextApprovalOfficer: data.nextApprovalOfficer
                        };
                        let checkOfficer = disbursement.approvalOfficers.filter(officer => `${officer.id}` == `${user._id}`);
                        if (checkOfficer.length == 0) {
                            disbursement.approvalOfficers.push({
                                name: user.name,
                                id: user._id,
                                office: user.subrole,
                                department: user.role,
                                stageOfApproval: transferCylinder_1.stagesOfApproval.STAGE3
                            });
                        }
                        //@ts-ignore
                        disbursement.tracking.push(track);
                        disbursement.requestStage = transferCylinder_1.stagesOfApproval.APPROVED;
                        disbursement.requestApproval = transferCylinder_1.TransferStatus.COMPLETED;
                        disbursement.approvalStage = transferCylinder_1.stagesOfApproval.START;
                        disbursement.disburseStatus = transferCylinder_1.TransferStatus.PENDING;
                        //set next branch
                        let nb = yield this.user.findById(data.nextApprovalOfficer);
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = data.nextApprovalOfficer;
                        //@ts-ignore
                        disbursement.fromBranch = nb === null || nb === void 0 ? void 0 : nb.branch;
                        //@ts-ignore
                        disbursement.comments.push({
                            comment: data.comment,
                            commentBy: user._id
                        });
                        yield disbursement.save();
                        yield logs_1.createLog({
                            user: user._id,
                            activities: {
                                title: 'Product Disbursal',
                                //@ts-ignore
                                activity: `You Approved a disbursal approval request from ${disbursement.initiator.name}`,
                                time: new Date().toISOString()
                            }
                        });
                        let apUser = yield this.user.findById(disbursement.nextApprovalOfficer);
                        yield new mail_1.default().push({
                            subject: "Product disbursal",
                            content: `A disbursal request has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                }
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchusersDisburseApprovals(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ] });
                //@ts-ignore
                const disbursement = yield this.disburse.paginate({
                    fromBranch: user.branch,
                    nextApprovalOfficer: user._id,
                    ApprovalStatus: transferCylinder_1.TransferStatus.PENDING
                }, options);
                // let startStage = disbursement.filter(transfer=> {
                //   if(transfer.approvalStage == stagesOfApproval.START) {
                //     for(let tofficer of transfer.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                //           return transfer
                //         }
                //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
                //         return transfer
                //       }
                //     }
                //   }
                // });
                // let stage1 = disbursement.filter(transfer=>{
                //   if(transfer.approvalStage == stagesOfApproval.STAGE1) {
                //     for(let tofficer of transfer.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                //           return transfer
                //         }
                //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
                //         return transfer
                //       }
                //     }
                //   }
                // });
                // let stage2 = disbursement.filter(transfer=>{
                //   if(transfer.approvalStage == stagesOfApproval.STAGE2) {
                //     for(let tofficer of transfer.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                //           return transfer
                //         }
                //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
                //         return transfer
                //       }
                //     }
                //   }
                // });
                // let disb;
                // if(user.subrole == 'superadmin'){
                //   disb = stage2;
                // }else if(user.subrole == 'head of department'){
                //   disb = stage1
                // }else {
                //   disb = startStage;
                // }
                return Promise.resolve(disbursement);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchusersDisburseRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ] });
                //@ts-ignore
                const disbursement = yield this.disburse.paginate({
                    branch: user.branch,
                    nextApprovalOfficer: user._id,
                    requestApproval: transferCylinder_1.TransferStatus.PENDING
                }, options);
                //   console.log(disbursement)
                // let startStage = disbursement.filter(transfer=> {
                //   if(transfer.requestStage == stagesOfApproval.START) {
                //     for(let tofficer of transfer.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE1){
                //           return transfer
                //         }
                //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
                //         return transfer
                //       }
                //     }
                //   }
                // });
                // let stage1 = disbursement.filter(transfer=>{
                //   if(transfer.requestStage == stagesOfApproval.STAGE1) {
                //     for(let tofficer of transfer.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE2){
                //           return transfer
                //         }
                //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
                //         return transfer
                //       }
                //     }
                //   }
                // });
                // let stage2 = disbursement.filter(transfer=>{
                //   if(transfer.requestStage == stagesOfApproval.STAGE2) {
                //     for(let tofficer of transfer.approvalOfficers) {
                //       if(`${tofficer.id}` == `${user._id}`){
                //         if(tofficer.stageOfApproval == stagesOfApproval.STAGE3){
                //           return transfer
                //         }
                //       }else if(`${transfer.nextApprovalOfficer}` == `${user._id}`){
                //         return transfer
                //       }
                //     }
                //   }
                // });
                // let disb;
                // if(user.subrole == 'superadmin'){
                //   disb = stage2;
                // }else if(user.subrole == 'head of department'){
                //   disb = stage1
                // }else {
                //   disb = startStage;
                // }
                return Promise.resolve(disbursement);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDisbursement(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursement = yield this.disburse.findById(id).populate([
                    { path: 'nextApprovalOffice', model: 'User' },
                    { path: 'initiator', model: 'User' },
                    { path: 'branch', model: 'branches' },
                    { path: 'customer', model: 'customer' },
                    { path: 'releasedTo', model: 'User' },
                    { path: 'releasedBy', model: 'User' }
                ]);
                return Promise.resolve(disbursement);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDisburseRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const disbursements = yield this.disburse.paginate({ branch: user.branch }, Object.assign({}, query));
                let totalApproved = yield this.disburse.find({ branch: user.branch, disburseStatus: transferCylinder_1.TransferStatus.COMPLETED });
                let totalPending = yield this.disburse.find({ branch: user.branch, disburseStatus: transferCylinder_1.TransferStatus.PENDING });
                return Promise.resolve({
                    disburse: disbursements,
                    count: {
                        totalApproved: totalApproved.length | 0,
                        totalPending: totalPending.length,
                        totalDisbursements: disbursements.length
                    }
                });
            }
            catch (error) {
                this.handleException(error);
            }
        });
    }
    fetchProductRequests(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const disbursements = yield this.disburse.paginate({ branch: user.branch }, Object.assign({}, query));
                let totalApproved = yield this.disburse.find({ branch: user.branch, requestApproval: transferCylinder_1.TransferStatus.COMPLETED });
                let totalPending = yield this.disburse.find({ branch: user.branch, requestApproval: transferCylinder_1.TransferStatus.PENDING });
                return Promise.resolve({
                    disburse: disbursements,
                    count: {
                        totalApproved: totalApproved.length | 0,
                        totalPending: totalPending.length | 0,
                        totalDisbursements: disbursements.length | 0
                    }
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    disburseReport(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const disbursements = yield this.disburse.paginate({ branch: user.branch, disburseStatus: transferCylinder_1.TransferStatus.COMPLETED }, Object.assign({}, query));
                return Promise.resolve(disbursements);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Product;
//# sourceMappingURL=index.js.map