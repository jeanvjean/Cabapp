"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
 * Handles database validation exception
 * @category Exceptions
 */
class DatabaseValidationException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {string} path
     * @param {MongooseError} err
     */
    constructor(message, path, err) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = DatabaseValidationException.name;
        this.code = codes_1.DatabaseValidationExceptionCode;
        this.err = err;
    }
}
exports.default = DatabaseValidationException;
//# sourceMappingURL=database-validation-exception.js.map