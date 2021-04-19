"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
/**
 * Base controller which would be inherited by other controllers.
 * @category Controllers
 */
class Ctrl {
    constructor() {
        this.HTTP_OK = 200;
        this.HTTP_CREATED = 201;
        this.HTTP_BAD_REQUEST = 400;
        this.HTTP_RESOURCE_NOT_FOUND = 404;
        this.HTTP_INTERNAL_SERVER_ERROR = 500;
        this.HTTP_UNAUTHENTICATED = 401;
        this.HTTP_UNAUTHORIZED = 403;
    }
    /**
     * handle successful response
     * @param {Response} res
     * @param {string} message
     * @param {Object|string} data
     */
    ok(res, message, data) {
        const fData = this.format(this.HTTP_OK, message, data);
        res.status(this.HTTP_OK).json(fData);
    }
    /**
     * @param {Exception} error
     * @param {Request} req
     * @param {Response} res
     */
    handleError(error, req, res) {
        // set locals, only providing error in development
        res.locals.message = error.message;
        res.locals.error = req.app.get('env') === 'development' ? error : {};
        if (error instanceof exceptions_1.InvalidAccessCredentialsException) {
            res.status(this.HTTP_UNAUTHORIZED).json(this.format(error.code, error.message));
        }
        else if (error instanceof exceptions_1.BadInputFormatException) {
            res.status(this.HTTP_BAD_REQUEST).json(this.format(error.code, error.message));
        }
        else if (error instanceof exceptions_1.NetworkException) {
            res.status(this.HTTP_INTERNAL_SERVER_ERROR).json(this.format(error.code, error.message));
        }
        else if (error instanceof exceptions_1.ResourceNotFoundException) {
            res.status(this.HTTP_RESOURCE_NOT_FOUND).json(this.format(error.code, error.message));
        }
        else if (error instanceof exceptions_1.DuplicateException) {
            res.status(this.HTTP_BAD_REQUEST).json(this.format(error.code, error.message));
        }
        else if (error instanceof exceptions_1.DatabaseException) {
            res.status(this.HTTP_INTERNAL_SERVER_ERROR).json(this.format(error.code, 'A database error has occurred'));
        }
        else if (error instanceof exceptions_1.DatabaseValidationException) {
            res.status(this.HTTP_BAD_REQUEST).json(this.format(error.code, 'There was an error with your request', error.err));
        }
        else {
            res.status(500);
        }
    }
    /**
     * Handler non existent routes
     * @param {Request} req
     * @param {Response} res
     */
    handleNotFound(req, res) {
        res.status(404).send('Resource not found.');
    }
    /**
     * Standardize response format
     * @param {number} code
     * @param {string} message
     * @param {object} data
     * @return {ResponseInterface}
     */
    format(code, message, data) {
        return {
            code,
            message,
            data
        };
    }
}
exports.default = Ctrl;
//# sourceMappingURL=ctrl.js.map