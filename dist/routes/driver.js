"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const auth = new authentication_1.default();
const router = express_1.Router();
router.post('/create-driver', auth.verify(), controllers_1.driverCtrl.createDriver());
router.delete('/delete-driver/:driverId', auth.verify(), controllers_1.driverCtrl.deleteDriver());
router.get('/fetch-drivers', auth.verify(), controllers_1.driverCtrl.fetchDrivers());
router.get('/fetch-driver/:driverId', auth.verify(), controllers_1.driverCtrl.fetchDriver());
exports.default = router;
//# sourceMappingURL=driver.js.map