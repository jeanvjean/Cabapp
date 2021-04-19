"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
 * Handles database exception
 * @category Exceptions
 */
class DatabaseException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {Error} err
     */
    constructor(message, err) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DatabaseException.name;
        this.code = codes_1.DatabaseExceptionCode;
        this.err = err;
    }
}
exports.default = DatabaseException;
//# sourceMappingURL=database-exception.js.map