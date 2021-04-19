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
const module_1 = require("../module");
const exceptions_1 = require("../../exceptions");
class Driver extends module_1.default {
    constructor(props) {
        super();
        this.driver = props.driver;
    }
    createDriver(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const driverExists = yield this.driver.findOne({ email: data.email });
                if (driverExists) {
                    throw new exceptions_1.BadInputFormatException('A driver already exists with this email');
                }
                const driver = yield this.driver.create(data);
                return Promise.resolve(driver);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    deleteDriver(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const driver = yield this.driver.findById(data.driverId);
                if (!driver) {
                    throw new exceptions_1.BadInputFormatException('thid driver no longer exist');
                }
                yield this.driver.findByIdAndDelete(data.driverId);
                return Promise.resolve({
                    message: 'Driver deleted'
                });
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDrivers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const drivers = yield this.driver.find(query);
                return Promise.resolve(drivers);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
    fetchDriver(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const driver = yield this.driver.findById(data.driverId);
                return Promise.resolve(driver);
            }
            catch (e) {
                this.handleException(e);
            }
        });
    }
}
exports.default = Driver;
//# sourceMappingURL=index.js.map