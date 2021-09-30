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
const cylinder_1 = require("../cylinder");
class Product extends module_1.default {
    constructor(props) {
        super();
        this.product = props.product;
        this.supplier = props.supplier;
        this.inventory = props.inventory;
        this.disburse = props.disburse;
        this.branch = props.branch;
        this.user = props.user;
        this.customer = props.customer;
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
                    email: newUser.email,
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
                const branches = yield this.branch.find({});
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
                const { partNumber } = data;
                let findProduct = yield this.product.findOne({ partNumber, branch: user.branch });
                if (findProduct) {
                    throw new exceptions_1.BadInputFormatException('a product with this part number already exists in your branch');
                }
                let product = new this.product(Object.assign(Object.assign({}, data), { branch: user.branch }));
                let findP = yield this.product.find({}).sort({ serialNumber: -1 }).limit(1);
                let sn;
                if (findP.length > 0) {
                    //@ts-ignore
                    sn = findP[0].serialNumber + 1;
                }
                else {
                    sn = 1;
                }
                //@ts-ignore
                product.serialNumber = sn;
                if (product.quantity > 0) {
                    product.inStock = true;
                    product.outOfStock = false;
                }
                else {
                    product.inStock = false;
                    product.outOfStock = true;
                }
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, instock, out } = query;
                const options = Object.assign(Object.assign({}, query), { populate: [
                        { path: 'supplier', model: 'supplier' },
                        { path: 'branch', model: 'branches' },
                        { path: 'division', model: 'branches' }
                    ] });
                let q = {
                    branch: user.branch,
                    deleted: false
                };
                let or = [];
                if (instock) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { quantity: { $gt: 0 } });
                }
                if (out) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { quantity: { $lt: 1 } });
                }
                if (search) {
                    or.push({ productName: new RegExp(search, 'gi') });
                    or.push({ equipmentType: new RegExp(search, 'gi') });
                    or.push({ location: new RegExp(search, 'gi') });
                }
                //@ts-ignore
                const products = yield this.product.paginate(q, options);
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
                const product = yield this.product.findById(id).populate([
                    { path: 'supplier', model: 'supplier' },
                    { path: 'branch', model: 'branches' }
                ]);
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
    mrnStats(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursal = yield this.disburse.find({});
                const issuedOut = yield this.inventory.find({});
                const totalIssuedOut = issuedOut.filter(inv => inv.branch == user.branch && inv.direction == receivedProduct_1.productDirection.OUT).length;
                const totalApproved = disbursal.filter(disb => disb.fromBranch == user.branch && disb.disburseStatus == transferCylinder_1.TransferStatus.COMPLETED).length;
                const totalPending = disbursal.filter(disb => disb.fromBranch == user.branch && disb.disburseStatus == transferCylinder_1.TransferStatus.PENDING).length;
                return Promise.resolve({
                    totalIssuedOut,
                    totalApproved,
                    totalPending
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    grnStats(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const disbursal = yield this.disburse.find({});
                const issuedOut = yield this.inventory.find({});
                const totalIssuedOut = issuedOut.filter(inv => inv.branch == user.branch);
                const totalApproved = disbursal.filter(disb => disb.fromBranch == user.branch && disb.disburseStatus == transferCylinder_1.TransferStatus.COMPLETED);
                const totalPending = disbursal.filter(disb => disb.fromBranch == user.branch && disb.disburseStatus == transferCylinder_1.TransferStatus.PENDING);
                return Promise.resolve({
                    totalGrn: totalIssuedOut.length | 0,
                    totalApprovedGrn: totalApproved.length | 0,
                    totalPendingGrn: totalPending.length | 0
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
                const { search, page, limit, name, email } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: {
                        path: 'branch', model: 'branches'
                    }
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (name) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { name: name });
                }
                if (email) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { email: email });
                }
                if (search) {
                    or.push({ supplierType: new RegExp(search, 'gi') });
                    or.push({ productType: new RegExp(search, 'gi') });
                }
                //@ts-ignore
                let suppliers = yield this.supplier.paginate(q, options);
                return Promise.resolve(suppliers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchAllSuppliers(user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const suppliers = yield this.supplier.find({ branch: user.branch });
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
                data.products = JSON.parse(data.products);
                const inventory = new this.inventory(Object.assign(Object.assign({}, data), { inspectingOfficer: user._id, branch: user.branch }));
                // let num = await generateNumber(6)
                let inv = yield this.inventory.find({ branch: user.branch }).sort({ grInit: -1 }).limit(1);
                let initNum;
                if (inv[0] == undefined) {
                    initNum = 1;
                }
                else {
                    initNum = inv[0].grInit + 1;
                }
                let init = "GRN";
                // let str = ""+initNum
                // let pad = "000000"
                // let ans = pad.substring(0, pad.length - str.length) + str;
                const num = token_1.padLeft(initNum, 6, "");
                let grnNo = init + num;
                inventory.grnNo = grnNo;
                inventory.grInit = initNum;
                let hod = yield this.user.find({ role: user.role, subrole: 'head of department' });
                yield new mail_1.default().push({
                    subject: "GRN approval",
                    content: `You have a pending grn approval, click the link to view. ${static_1.default.FRONTEND_URL}/inventory/fetch-inventory/${inventory._id}`,
                    user: hod
                });
                yield inventory.save();
                return Promise.resolve(inventory);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    approveGrn(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let grn = yield this.inventory.findById(data.grnId);
                if (grn) {
                    if (data.status == 'rejected') {
                        let initiator = yield this.user.findById(grn.inspectingOfficer);
                        yield new mail_1.default().push({
                            subject: "GRN approval",
                            content: `Your Grn approval request was rejected, click the link to view. ${static_1.default.FRONTEND_URL}/inventory/fetch-inventory/${grn._id}`,
                            user: initiator
                        });
                        throw new exceptions_1.BadInputFormatException('Not approved');
                    }
                    let products = grn.products;
                    if (grn.direction == receivedProduct_1.productDirection.IN) {
                        for (let product of products) {
                            let prod = yield this.product.findOne({ partNumber: product.partNumber, branch: user.branch });
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
                    else if (grn.direction == receivedProduct_1.productDirection.OUT) {
                        for (let product of products) {
                            let prod = yield this.product.findOne({ asnlNumber: product.partNumber, branch: user.branch });
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
                }
                else {
                    throw new exceptions_1.BadInputFormatException('no grn found with this id');
                }
                grn.approved = true;
                let initiator = yield this.user.findById(grn.inspectingOfficer);
                yield new mail_1.default().push({
                    subject: "GRN approval",
                    content: `Your Grn approval request was approved, click the link to view. ${static_1.default.FRONTEND_URL}/inventory/fetch-inventory/${grn._id}`,
                    user: initiator
                });
                yield grn.save();
                return Promise.resolve(grn);
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
    //GRN
    fetchInventories(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit, fromDate, toDate, totalCost, partNo, quantity, productName } = query;
                let or = [];
                if (productName) {
                    or.push({ "products.productName": new RegExp(productName, "gi") });
                }
                if (partNo) {
                    or.push({ "products.partNumber": new RegExp(partNo, "gi") });
                }
                if (quantity) {
                    or.push({ "products.quantity": new RegExp(quantity, "gi") });
                }
                if (totalCost) {
                    or.push({ "products.totalCost": new RegExp(totalCost, "gi") });
                }
                let q = {
                    branch: user.branch
                };
                if (fromDate && toDate) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) } });
                }
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'inspectingOfficer', model: 'User' },
                        { path: 'branch', model: 'branches' }
                    ]
                };
                //@ts-ignore
                const inventories = yield this.inventory.paginate(q, options);
                return Promise.resolve({
                    inventory: inventories
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
                const inventory = yield this.inventory.findById(inventoryId).populate([
                    { path: 'inspectingOfficer', model: 'User' },
                    { path: 'branch', model: 'branches' }
                ]);
                return Promise.resolve(inventory);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    //MRN
    disburseProduct(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let hod = yield this.user.findOne({
                    role: user.role,
                    subrole: 'head of department',
                    branch: user.branch
                });
                const disbursement = new this.disburse(Object.assign(Object.assign({}, data), { nextApprovalOfficer: hod === null || hod === void 0 ? void 0 : hod._id, initiator: user._id, branch: user.branch, requestDepartment: user.role }));
                let finGrn = yield this.disburse.find({}).sort({ grnInit: -1 }).limit(1);
                let initGrn;
                if (finGrn[0]) {
                    if (finGrn[0].grnInit) {
                        initGrn = finGrn[0].grnInit + 1;
                    }
                    else {
                        initGrn = 1;
                    }
                }
                else {
                    initGrn = 1;
                }
                let mrn = "MRN";
                let init = "GRN";
                let num = yield token_1.padLeft(initGrn, 6, "");
                //@ts-ignore
                disbursement.grnNo = init + num;
                disbursement.mrn = mrn + num;
                disbursement.grnInit = initGrn;
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
                            content: `A disbursal you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                            content: `A disbursal you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                            content: `A disbursal request you approved was rejected. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                }
                else {
                    let ObjectId = cylinder_1.mongoose.Types.ObjectId;
                    let hod = yield this.user.findOne({ branch: user.branch, subrole: 'head of department', role: user.role }).populate({
                        path: 'branch', model: 'branches'
                    });
                    let newBranchApprovalOfficer = yield this.user.findOne({ branch: data.fromBranch, subrole: 'sales executive', role: "sales" });
                    // console.log(newBranchApprovalOfficer);
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
                            content: `A disbursal has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.approvalStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let branchAdmin = yield this.user.findOne({ branch: hod === null || hod === void 0 ? void 0 : hod.branch, subrole: "superadmin" });
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            //@ts-ignore
                            nextApprovalOfficer: branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id
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
                        disbursement.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
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
                            content: `A disbursal has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                            content: `product disbursal request has been approved. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                            content: `A disbursal request initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
                            user: apUser
                        });
                        return Promise.resolve(disbursement);
                    }
                    else if ((disbursement === null || disbursement === void 0 ? void 0 : disbursement.requestStage) == transferCylinder_1.stagesOfApproval.STAGE1) {
                        let brenchRequestApproval = yield this.user.findOne({ branch: user.branch, subrole: 'head of department' }).populate({
                            path: 'branch', model: 'branches'
                        });
                        // console.log(brenchRequestApproval)
                        let branchAdmin = yield this.user.findOne({ branch: brenchRequestApproval === null || brenchRequestApproval === void 0 ? void 0 : brenchRequestApproval.branch, subrole: "superadmin" });
                        let track = {
                            title: "Approval Prorcess",
                            stage: transferCylinder_1.stagesOfApproval.STAGE2,
                            status: transferCylinder_1.ApprovalStatus.APPROVED,
                            dateApproved: new Date().toISOString(),
                            approvalOfficer: user._id,
                            //@ts-ignore
                            nextApprovalOfficer: branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id
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
                        disbursement.nextApprovalOfficer = branchAdmin === null || branchAdmin === void 0 ? void 0 : branchAdmin._id;
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
                            content: `A disbursal request has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                            nextApprovalOfficer: newBranchApprovalOfficer === null || newBranchApprovalOfficer === void 0 ? void 0 : newBranchApprovalOfficer._id
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
                        let nb = yield this.user.findById(newBranchApprovalOfficer === null || newBranchApprovalOfficer === void 0 ? void 0 : newBranchApprovalOfficer._id);
                        //@ts-ignore
                        disbursement.nextApprovalOfficer = newBranchApprovalOfficer._id;
                        // console.log(disbursement)
                        //@ts-ignore
                        disbursement.fromBranch = data.fromBranch;
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
                            content: `A disbursal request has been initiated and needs your approval. check and make appropriate corrections approval click to view ${static_1.default.FRONTEND_URL}/inventory/fetch-disbursement/${disbursement._id}`,
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 0,
                    populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ]
                };
                let q = {
                    disburseStatus: transferCylinder_1.TransferStatus.PENDING,
                    nextApprovalOfficer: user._id,
                    fromBranch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ grnNo: new RegExp(search, 'gi') });
                    or.push({ mrn: new RegExp(search, 'gi') });
                    or.push({ jobTag: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const disbursement = yield this.disburse.aggregatePaginate(q, options);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 0,
                    populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ]
                };
                let q = {
                    requestApproval: transferCylinder_1.TransferStatus.PENDING,
                    nextApprovalOfficer: user._id,
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ grnNo: new RegExp(search, 'gi') });
                    or.push({ mrn: new RegExp(search, 'gi') });
                    or.push({ jobTag: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const disbursement = yield this.disburse.aggregatePaginate(q, options);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ]
                };
                let q = {
                    fromBranch: user.branch
                };
                let or = [];
                if (filter) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { disburseStatus: filter });
                }
                if (search) {
                    or.push({ grnNo: new RegExp(search, 'gi') });
                    or.push({ mrn: new RegExp(search, 'gi') });
                    or.push({ jobTag: new RegExp(search, 'gi') });
                    or.push({ customer: new RegExp(search, 'gi') });
                    or.push({ requestDepartment: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const disbursements = yield this.disburse.paginate(q, options);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ]
                };
                let q = {
                    branch: user.branch
                };
                let or = [];
                if (filter) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { disburseStatus: filter });
                }
                if (search) {
                    or.push({ grnNo: new RegExp(search, 'gi') });
                    or.push({ mrn: new RegExp(search, 'gi') });
                    or.push({ jobTag: new RegExp(search, 'gi') });
                    or.push({ customer: new RegExp(search, 'gi') });
                    or.push({ requestDepartment: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const disbursements = yield this.disburse.paginate(q, options);
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
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ]
                };
                let q = {
                    disburseStatus: transferCylinder_1.TransferStatus.COMPLETED,
                    fromBranch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ grnNo: new RegExp(search, 'gi') });
                    or.push({ jobTag: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const disbursements = yield this.disburse.paginate(q, options);
                return Promise.resolve(disbursements);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    restockReport(query, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ObjectId = cylinder_1.mongoose.Types.ObjectId;
                const { search, filter, page, limit } = query;
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    populate: [
                        { path: 'nextApprovalOffice', model: 'User' },
                        { path: 'initiator', model: 'User' },
                        { path: 'branch', model: 'branches' },
                        { path: 'customer', model: 'customer' },
                        { path: 'releasedTo', model: 'User' },
                        { path: 'releasedBy', model: 'User' }
                    ]
                };
                let q = {
                    disburseStatus: transferCylinder_1.TransferStatus.COMPLETED,
                    branch: user.branch
                };
                let or = [];
                if (search) {
                    or.push({ grnNo: new RegExp(search, 'gi') });
                    or.push({ jobTag: new RegExp(search, 'gi') });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                const disbursements = yield this.disburse.paginate(q, options);
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