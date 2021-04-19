"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
/**
 * Base exception class
 * @category Exceptions
 */
class Exception extends Error {
    /**
     * @constructor
     * @param {string} message
     * @param {Object|string} meta
     */
    constructor(message, meta) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = Exception.name;
        this.code = codes_1.ExceptionCode;
        this.meta = meta;
    }
}
exports.default = Exception;
//# sourceMappingURL=exception.js.map