"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let Secret = /** @class */ (() => {
    class Secret {
    }
    Secret.NODE_ENV = "development";
    Secret.PORT = "3100";
    //[Mongo]
    Secret.MONGODB_URI = "mongodb+srv://tech:Wittercell@development.8h65w.mongodb.net/asnlretryWrites=true&w=majority";
    Secret.PUBLIC_SMTP = '56c4e79aa88d87130939928a0c28f30d';
    Secret.PRIVATE_SMTP = '53e7d95532c54eae01bba10822c7e456';
    Secret.SMTP_FROM_EMAIL = 'maranathatolulope@gmail.com';
    Secret.SMTP_FROM_NAME = 'gmail';
    Secret.CLOUDINARY_KEY = "227697655458693";
    Secret.CLOUDINARY_SECRET = "iMeFPISULshzgunCBP-cpdOO6kk";
    Secret.CLOUDINARY_NAME = "dorz7hgqx";
    Secret.FCM_SERVER_KEY = '';
    Secret.FRONTEND_URL = `https://asnl-web.netlify.app`;
    return Secret;
})();
exports.default = Secret;
//# sourceMappingURL=static.js.map