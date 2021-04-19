"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const body_parser_1 = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const logger = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const dotenv_1 = require("dotenv");
const app_1 = require("./configs/app");
const controllers_1 = require("./controllers");
const routes_1 = require("./routes");
const fileUpload = require('express-fileupload');
/**
 * Express application
 */
class Application {
    /**
     * @constructor
     */
    constructor() {
        this.express = express();
        this.configure();
        this.handleExceptions();
        this.express.listen(app_1.default.port, () => {
            console.log(`${app_1.default.appName} is listening at port ${app_1.default.port}`);
        });
    }
    /**
     * Configure express application
     */
    configure() {
        this.express.use(logger('dev'));
        this.express.use(body_parser_1.json({ limit: app_1.default.clientBodyLimit }));
        this.express.use(body_parser_1.urlencoded({ extended: true }));
        this.express.use(cookieParser());
        this.express.use(express.static(path_1.join(__dirname, '../', 'public')));
        this.express.use(compression());
        this.express.use(fileUpload());
        this.express.use(cors());
        this.express.use(helmet());
        this.express.use('/', routes_1.default);
    }
    /**
     * Handles express application exceptions
     */
    handleExceptions() {
        this.express.use(controllers_1.ctrl.handleNotFound);
        this.express.use(controllers_1.ctrl.handleError);
    }
}
// Load environment variables
dotenv_1.config();
// Initialize application
new Application();
//# sourceMappingURL=index.js.map