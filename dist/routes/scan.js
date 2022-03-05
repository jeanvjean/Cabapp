"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scan_1 = require("../controllers/scan");
const authentication_1 = require("../middlewares/authentication");
const controllers_1 = require("../controllers");
const auth = new authentication_1.default();
const val = new scan_1.Validator();
const router = express_1.Router();
router.get('/scan-cylinder', controllers_1.scanCtrl.startScan());
router.get('/fetch-scans', auth.verify(), controllers_1.scanCtrl.fetchScans());
router.get('/scan-info/:formId', auth.verify(), controllers_1.scanCtrl.scanInfo());
router.get('/complete-scan/:formId', controllers_1.scanCtrl.complete());
router.get('/initiate-scan', controllers_1.scanCtrl.initiateScan());
router.post('/update-scan', controllers_1.scanCtrl.update());
exports.default = router;
//# sourceMappingURL=scan.js.map