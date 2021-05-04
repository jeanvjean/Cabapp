"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = exports.UserRoles = exports.salt = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = require("bcryptjs");
exports.salt = bcryptjs_1.genSaltSync(10);
const permissions = require('../util/permissions.json');
/**
 * Attributes of a user
 * @meta Model Model
 */
var UserRoles;
(function (UserRoles) {
    UserRoles["ADMIN"] = "admin";
    UserRoles["SALES"] = "sales";
    UserRoles["PRODUCTION"] = "production";
    UserRoles["ACCOUNT"] = "account";
    UserRoles["SECURITY"] = "security";
    UserRoles["AUDIT"] = "audit";
})(UserRoles = exports.UserRoles || (exports.UserRoles = {}));
exports.userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        lowercase: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    account_type: {
        type: String
    },
    role: {
        type: String
    },
    subrole: {
        type: String
    },
    token: {
        type: String
    },
    deactivated: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    location: { type: String },
    gender: { type: String },
    phoneNumber: { type: Number },
    branch: { type: mongoose_1.Schema.Types.ObjectId, ref: 'branches' },
    permissions: [{
            name: String,
            sub_permissions: [String]
        }]
}, {
    collection: 'users',
    timestamps: true
});
exports.userSchema.methods.comparePWD = function (value) {
    return __awaiter(this, void 0, void 0, function* () {
        let isMatch = yield bcryptjs_1.compare(value, this.password);
        return Promise.resolve(isMatch);
    });
};
exports.userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield bcryptjs_1.hash(this.password, exports.salt);
        }
        if (this.subrole == 'superadmin') {
            this.permissions = permissions.permissions;
        }
        next();
    });
});
exports.userSchema.pre('update', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield bcryptjs_1.hash(this.password, exports.salt);
        }
        next();
    });
});
function factory(conn) {
    return conn.model('User', exports.userSchema);
}
exports.default = factory;
//# sourceMappingURL=user.js.map