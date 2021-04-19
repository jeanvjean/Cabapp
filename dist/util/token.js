"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const crypto = require("crypto");
exports.generateToken = (num) => new Promise((resolve, reject) => {
    crypto.randomBytes(num || 16, (err, buffer) => {
        if (err)
            reject(err);
        const token = buffer.toString('hex');
        resolve(token);
    });
});
//# sourceMappingURL=token.js.map