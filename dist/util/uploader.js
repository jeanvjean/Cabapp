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
const cloud = require('cloudinary');
const cloudinary = cloud.v2;
const static_1 = require("../configs/static");
class Uploader {
    constructor() { }
    upload(stream, path, override = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                cloudinary.config({
                    cloud_name: static_1.default.CLOUDINARY_NAME,
                    api_key: static_1.default.CLOUDINARY_KEY,
                    api_secret: static_1.default.CLOUDINARY_SECRET
                });
                let result = yield cloudinary.uploader.upload(stream, Object.assign({ folder: path, resource_type: "auto" }, override), () => { });
                return result.secure_url;
            }
            catch (err) {
                console.log(err);
                throw new Error(err);
            }
        });
    }
    destroy(file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                cloudinary.config({
                    cloud_name: static_1.default.CLOUDINARY_NAME,
                    api_key: static_1.default.CLOUDINARY_KEY,
                    api_secret: static_1.default.CLOUDINARY_SECRET
                });
                return yield cloudinary.uploader.destroy(file);
            }
            catch (err) {
                throw new Error(err);
            }
        });
    }
}
exports.default = Uploader;
//# sourceMappingURL=uploader.js.map