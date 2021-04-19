"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
 * Handles exception when resource is access with wrong credentials
 * @category Exceptions
 */
class InvalidAccessCredentialsException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {object} cred
     */
    constructor(message, cred) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidAccessCredentialsException.name;
        this.code = codes_1.InvalidAccessCredentialExceptionCode;
        this.cred = cred;
    }
}
exports.default = InvalidAccessCredentialsException;
//# sourceMappingURL=invalid-access-credentials-exception.js.map