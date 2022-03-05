"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
 * Handles invalid and bad input exceptions
 * @category Exceptions
 */
class BadInputFormatException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {InputError} errors
     */
    constructor(message, errors) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = BadInputFormatException.name;
        this.code = codes_1.BadInputFormatExceptionCode;
        this.errors = errors;
    }
}
exports.default = BadInputFormatException;
//# sourceMappingURL=bad-input-format-exception.js.map