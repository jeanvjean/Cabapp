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
const module_1 = require("../module");
/**
 * Person module: handle all person interaction with database and business logic
 * @category Modules
 */
class Person extends module_1.default {
    /**
     * @constructor
     * @param {Object} props
     * @param {Model<PersonInterface>} props.model Mongoose Person model
     */
    constructor(props) {
        super();
        this.model = props.model;
    }
    /**
     * Creates a new person
     * @param {NewPersonInterface} data property of person to be created
     * @throws MongooseError.ValidationError
     * @throws MongoError
     * @throws DuplicateException
     * @return {Promise<Object>}
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Todo: implement create person
            let newPerson;
            try {
                newPerson = yield this.model.create(Object.assign({}, data));
            }
            catch (e) {
                this.handleException(e);
            }
            return newPerson;
        });
    }
    /**
     * Fetch people
     * @param {QueryInterface} query
     */
    get(query) {
        return __awaiter(this, void 0, void 0, function* () {
            // Todo: implement fetch people
            const people = yield this.model.find(query);
            return Promise.resolve(people);
        });
    }
    /**
     * Update a person record
     * @param {object} prop the person properties to update
     * @param {object} options other option that would influence how the update will be performed.
     * @throws MongoError
     * @return {PersonInterface}
     */
    update(prop, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve({});
            // Todo: implement update
        });
    }
    /**
     * Deletes a person from the database
     * @param {string} personId Id of the person
     * @throws MongoError
     */
    delete(personId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(true);
            // Todo: implement delete operation
        });
    }
    /**
     * getFullName method
     * @param {string} firstName
     * @param {string} lastName
     * @return {string}
     */
    static getFullName(firstName, lastName) {
        return `${firstName} ${lastName}`;
    }
}
exports.default = Person;
//# sourceMappingURL=index.js.map