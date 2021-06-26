"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * MongoDB configurations
 * @category Configurations
 */
let Mongo = /** @class */ (() => {
    class Mongo {
    }
    /**
     * @param {string} uri Connection string for mongodb database server
     */
    Mongo.uri = process.env.MONGODB_URI || "mongodb://localhost:27017/air-separation";
    /**
     * @param {ConnectionOptions} options Mongodb server options
     */
    Mongo.options = {
        socketTimeoutMS: 0,
        keepAlive: true,
        reconnectTries: 20,
        poolSize: process.env.NODE_ENV === 'production' ? 5 : 1,
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    };
    return Mongo;
})();
exports.default = Mongo;
//# sourceMappingURL=mongo.js.map