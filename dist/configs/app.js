"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * General app configuration
 * @category Configurations
 */
let App = /** @class */ (() => {
    class App {
    }
    /**
     * Name of the app
     * @param {string} appName
     */
    App.appName = 'Air separation app';
    /**
     * The port to run the application
     * @param {number} port
     */
    App.port = process.env.PORT || 3100;
    /**
     * The environment of the current running context
     * @param {string} env
     */
    App.env = process.env.NODE_ENV || 'development';
    /**
     * Maximum size of the client upload
     * @param {string} clientBodyLimit
     */
    App.clientBodyLimit = '50mb';
    return App;
})();
exports.default = App;
//# sourceMappingURL=app.js.map