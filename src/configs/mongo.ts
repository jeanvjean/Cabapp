import {ConnectionOptions} from 'mongoose';

/**
 * MongoDB configurations
 * @category Configurations
 */
class Mongo {
  /**
   * @param {string} uri Connection string for mongodb database server
   */
  static uri = process.env.MONGODB_URI || 'mongodb+srv://tech:Wittercell@development.8h65w.mongodb.net/asnlretryWrites=true&w=majority';

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
