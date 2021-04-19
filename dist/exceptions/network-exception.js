"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codes_1 = require("./codes");
const exception_1 = require("./exception");
/**
 * Handles exception when there is a network error
 * @category Exceptions
 */
class NetworkException extends exception_1.default {
    /**
     * @constructor
     * @param {string} message
     * @param {string} url
     * @param {Error} err
     */
    constructor(message, url, err) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = NetworkException.name;
        this.code = codes_1.NetworkExceptionCode;
        this.url = url;
        this.err = err;
    }
}
exports.default = NetworkException;
//# sourceMappingURL=network-exception.js.map