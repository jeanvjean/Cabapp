import {ConnectionOptions} from 'mongoose';

/**
 * MongoDB configurations
 * @category Configurations
 */
class Mongo {
  /**
   * @param {string} uri Connection string for mongodb database server
   */

  static url =
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'development';

  static uri = process.env.NODE_ENV === 'production'? "mongodb+srv://tech:Wittercell@development.8h65w.mongodb.net/asnlretryWrites=true&w=majority" : "mongodb://localhost:27017/air-separation";
  /**
   * @param {ConnectionOptions} options Mongodb server options
   */
  static options: ConnectionOptions = {
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 20,
    poolSize: process.env.NODE_ENV === 'production' ? 5 : 1,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  };
}

export default Mongo;
