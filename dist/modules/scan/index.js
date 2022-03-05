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
const scan_1 = require("../../models/scan");
const module_1 = require("../module");
const mail_1 = require("../../util/mail");
const token_1 = require("../../util/token");
class Scan extends module_1.default {
    constructor(props) {
        super(),
            this.scan = props.scan;
        this.cylinder = props.cylinder;
    }
    ScanCylinder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!data.barcode) {
                    throw new exceptions_1.BadInputFormatException('a barcode scan is needed');
                }
                if (!data.formId) {
                    throw new exceptions_1.BadInputFormatException('formId is needed');
                }
                let found = yield this.scan.findOne({ formId: data.formId });
                if (!found) {
                    throw new exceptions_1.BadInputFormatException('no form with this formId found');
                }
                // console.log(data.barcode);
                let cyl = yield this.cylinder.findOne({ barcode: data.barcode });
                // console.log(cyl)
                if (!cyl) {
                    throw new exceptions_1.BadInputFormatException('cylinder info not found');
                }
                let m = found.cylinders.map(doc => doc.barcode);
                if (m.includes(data.barcode)) {
                    throw new exceptions_1.BadInputFormatException('this cylinder has been scanned');
                }
                found.cylinders.push({
                    cylinderNumber: cyl.cylinderNumber,
                    assignedNumber: cyl.assignedNumber,
                    barcode: cyl.barcode
                });
                yield found.save();
                yield new mail_1.default().saveFormToFirebase({
                    formId: found.formId,
                    cylinders: found.cylinders,
                    status: found.status
                });
                return Promise.resolve(found);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    updateCyliderScan(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { cylinders, formId } = data;
                let scan = yield this.scan.findOne({ formId });
                if (!scan) {
                    throw new exceptions_1.BadInputFormatException('form not found');
                }
                let saveCyl = scan.cylinders;
                for (let cylinder of cylinders) {
                    let m = scan.cylinders.map(doc => doc.barcode);
                    if (!m.includes(cylinder.barcode)) {
                        saveCyl.push(cylinder);
                    }
                }
                // let updated = await scan.update({cylinders:saveCyl});
                scan.cylinders = saveCyl;
                yield new mail_1.default().saveFormToFirebase({
                    formId: scan.formId,
                    cylinders: scan.cylinders,
                    status: scan.status
                });
                yield scan.save();
                return Promise.resolve(scan);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchScans(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { search, page, limit, cylinderNumber, assignedNumber, barcode, status } = query;
                let options = {
                    page: page || 1,
                    limit: limit || 10
                };
                let q = {};
                let or = [];
                if (search) {
                    or.push({ formId: new RegExp(search, 'gi') });
                }
                if (cylinderNumber) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'cylinders.cylinderNumber': cylinderNumber });
                }
                if (assignedNumber) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'cylinders.assignedNumber': assignedNumber });
                }
                if (barcode) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { 'cylinders.barcode': barcode });
                }
                if (status) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { status: status });
                }
                if (or.length > 0) {
                    //@ts-ignore
                    q = Object.assign(Object.assign({}, q), { $or: or });
                }
                //@ts-ignore
                let scan = yield this.scan.paginate(q, options);
                return Promise.resolve(scan);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    scanInfo(formId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scan = yield this.scan.findOne({ formId: formId });
                if (!scan) {
                    throw new exceptions_1.BadInputFormatException('scan information not found');
                }
                return Promise.resolve(scan);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    complete(formId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let scan = yield this.scan.findOne({ formId });
                if (!scan) {
                    throw new exceptions_1.BadInputFormatException('scan information not found');
                }
                scan.status = scan_1.scanStatus.COMPLETE;
                yield new mail_1.default().saveFormToFirebase({
                    formId: scan.formId,
                    cylinders: scan.cylinders,
                    status: scan.status
                });
                yield scan.save();
                return Promise.resolve({
                    scan,
                    message: 'scan completed'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    initiateScan() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let form = new this.scan();
                let oldScan = yield this.scan.find({}).sort({ initNum: -1 }).limit(1);
                let formId;
                if (oldScan[0]) {
                    formId = oldScan[0].initNum + 1;
                }
                else {
                    formId = 1;
                }
                form.formId = token_1.padLeft(formId, 6, '');
                form.initNum = formId;
                yield form.save();
                yield new mail_1.default().saveFormToFirebase({
                    formId: form.formId,
                    cylinders: form.cylinders,
                    status: form.status
                });
                return Promise.resolve(form);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Scan;
//# sourceMappingURL=index.js.map