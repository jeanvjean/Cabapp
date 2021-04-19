"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const exceptions_1 = require("../exceptions");
const mongodb_1 = require("mongodb");
/**
 * Base model class
 * @category Modules
 */
class Module {
    /**
     * Handle generic error in modules
     * @param {Error} error
     */
    handleException(error) {
        if (error instanceof mongoose_1.Error.ValidationError) {
            throw new exceptions_1.DatabaseValidationException(error.message, 'person', error);
        }
        else if (error instanceof mongodb_1.MongoError) {
            throw new exceptions_1.DatabaseException(error.errmsg, error);
        }
        else {
            throw error;
        }
    }
}
exports.default = Module;
//# sourceMappingURL=module.js.map