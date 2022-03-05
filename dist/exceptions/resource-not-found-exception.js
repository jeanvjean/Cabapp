"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
 * Handles resource not found exceptions
 * @category Exceptions
 */
class ResourceNotFoundException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {string} type
     */
    constructor(message, type) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = ResourceNotFoundException.name;
        this.code = codes_1.ResourceNotFoundExceptionCode;
        this.type = type;
    }
}
exports.default = ResourceNotFoundException;
//# sourceMappingURL=resource-not-found-exception.js.map