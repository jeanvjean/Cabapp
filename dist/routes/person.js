"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const authentication_1 = require("../middlewares/authentication");
const auth = new authentication_1.default();
/**
 * @category Routers
 */
const router = express_1.Router();
/**
 * Create new person route
 */
router.post('/new', auth.verify(), controllers_1.personCtrl.create());
/**
 * Fetch all people
 */
router.get('/fetch', controllers_1.personCtrl.fetch());
/**
 * Route to delete all people
 */
router.delete('/', controllers_1.personCtrl.delete());
exports.default = router;
//# sourceMappingURL=person.js.map