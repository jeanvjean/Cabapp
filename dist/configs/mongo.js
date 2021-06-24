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
    Mongo.url = process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'development';
    Mongo.uri = process.env.NODE_ENV === 'production' ? "mongodb+srv://tech:Wittercell@development.8h65w.mongodb.net/asnlretryWrites=true&w=majority" : "mongodb://localhost:27017/air-separation";
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