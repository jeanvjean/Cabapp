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
exports.uploadFile = void 0;
const fs_1 = require("fs");
const uploader_1 = require("../../util/uploader");
const ctrl_1 = require("../ctrl");
class driverCtrl extends ctrl_1.default {
    constructor(module) {
        super();
        this.module = module;
    }
    createDriver() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                let image = yield exports.uploadFile(req.files, 'profile_image/');
                const data = yield this.module.createDriver(Object.assign(Object.assign({}, req.body), { image }));
                this.ok(res, 'Created', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    deleteDriver() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { driverId } = req.params;
                const data = yield this.module.deleteDriver({ driverId });
                this.ok(res, 'Deleted', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchDrivers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchDrivers(req.query, req.user);
                this.ok(res, 'Fetched', data);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchDriver() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { driverId } = req.params;
                const driver = yield this.module.fetchDriver({ driverId });
                this.ok(res, 'details fetched', driver);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
    fetchallDrivers() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //@ts-ignore
                const data = yield this.module.fetchallDrivers(req.query, req.user);
            }
            catch (e) {
                this.handleError(e, req, res);
            }
        });
    }
}
exports.uploadFile = (file, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const files = file;
    let path = './temp';
    if (!fs_1.existsSync(path)) {
        fs_1.mkdirSync(path);
    }
    if (Array.isArray(files)) {
        let images = [];
        for (let f of files) {
            //@ts-ignore
            yield f.mv(path + '/' + f.name);
            let uploader = new uploader_1.default();
            //@ts-ignore
            let url = yield uploader.upload(path + '/' + f.name, filePath, {});
            images.push(url);
            //@ts-ignore
            fs_1.unlinkSync(path + '/' + f.name);
        }
        // res.send({images, message: 'files uploaded'})
        return images;
    }
    else {
        //@ts-ignore
        yield files.mv(path + '/' + files.name);
        let uploader = new uploader_1.default();
        //@ts-ignore
        let url = yield uploader.upload(path + '/' + files.name, filePath, {});
        //@ts-ignore
        fs_1.unlinkSync(path + '/' + files.name);
        // res.send({image: url, message: 'file uploaded'})
        return url;
    }
});
exports.default = driverCtrl;
//# sourceMappingURL=index.js.map