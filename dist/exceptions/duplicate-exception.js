"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
* Handles Duplicate exception
* @category Exceptions
*/
class DuplicateException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {string} field
     */
    constructor(message, field) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DuplicateException.name;
        this.code = codes_1.DuplicateExceptionCode;
        this.field = field;
    }
}
exports.default = DuplicateException;
//# sourceMappingURL=duplicate-exception.js.map