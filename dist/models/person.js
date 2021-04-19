"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gender = void 0;
const mongoose_1 = require("mongoose");
/**
 * Gender of a Person
 * @category Models
 */
var Gender;
(function (Gender) {
    Gender["Male"] = "Male";
    Gender["Female"] = "Female";
})(Gender = exports.Gender || (exports.Gender = {}));
/**
 * Mogoose schema of a Person
 * @category Models
 */
const PersonSchema = new mongoose_1.Schema({
    name: {
        type: mongoose_1.Schema.Types.String,
        required: true
    },
    age: {
        type: mongoose_1.Schema.Types.Number,
        required: true
    },
    gender: {
        type: mongoose_1.Schema.Types.String,
    },
    dob: {
        type: mongoose_1.Schema.Types.Date
    },
    creator: { type: mongoose_1.Schema.Types.ObjectId }
}, {
    collection: 'people',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});
PersonSchema.pre('validate', function (next) {
    // eslint-disable-next-line no-invalid-this
    if (!this.dob)
        this.dob = new Date();
    next();
});
/**
 * Factory to generate Person Model
 * @param {Connection} conn
 * @return {Model<PersonInterface>}
 * @category Models
 */
function factory(conn) {
    return conn.model('Person', PersonSchema);
}
exports.default = factory;
//# sourceMappingURL=person.js.map