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
const ctrl_1 = require("../ctrl");
/**
 * Person controller
 * @category Controllers
 */
class PersonCtrl extends ctrl_1.default {
    /**
     * @constructor
     * @param {Person} module
     */
    constructor(module) {
        super();
        this.module = module;
    }
    /**
     * Request handler for creating new person
     * @return {RequestHandler}
     */
    create() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            // Todo: implement create handler
            const { body } = req;
            //@ts-ignore
            const record = yield this.module.create(body, req.user);
            this.ok(res, 'ok', record);
        });
    }
    /**
     * Request handler to fetch people
     * @return {RequestHandler}
     */
    fetch() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            // Todo: implement create handler
            const query = {};
            const users = yield this.module.get(query);
            this.ok(res, 'ok', users);
        });
    }
    /**
     * Request handler to delete person
     * @return {RequestHandler}
     */
    delete() {
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            // Todo: implement delete handler
            res.send(req.body);
        });
    }
}
exports.default = PersonCtrl;
//# sourceMappingURL=index.js.map