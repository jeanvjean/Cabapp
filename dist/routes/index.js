"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_1 = require("../configs/app");
const person_1 = require("./person");
const user_1 = require("./user");
const cylinder_1 = require("./cylinder");
const inventory_1 = require("./inventory");
const vehicle_1 = require("./vehicle");
const driver_1 = require("./driver");
const Uploader_1 = require("../controllers/Uploader");
const uploader = new Uploader_1.default();
const router = express_1.Router();
router.get('/', (req, res) => {
    res.send(`You've reached api routes of ${app_1.default.appName}`);
});
router.use('/person', person_1.default);
router.use('/user', user_1.default);
router.use('/cylinder', cylinder_1.default);
router.use('/inventory', inventory_1.default);
router.use('/vehicle', vehicle_1.default);
router.use('/driver', driver_1.default);
router.post('/upload', uploader.fileUpload());
exports.default = router;
//# sourceMappingURL=index.js.map