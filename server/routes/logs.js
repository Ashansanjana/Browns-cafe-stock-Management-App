const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');

// Accounting Periods
router.get('/periods', logsController.getPeriods);
router.post('/periods/close', logsController.closePeriod);

// GRN Log
router.get('/grn', logsController.getGrnLog);
router.post('/grn', logsController.addGrnEntry);
router.delete('/grn/:id', logsController.deleteGrnEntry);

// Issue Log
router.get('/issue', logsController.getIssueLog);
router.post('/issue', logsController.addIssueEntry);
router.delete('/issue/:id', logsController.deleteIssueEntry);

// Adj Log
router.get('/adj', logsController.getAdjLog);
router.post('/adj', logsController.addAdjEntry);
router.delete('/adj/:id', logsController.deleteAdjEntry);

// Usage Log
router.get('/usage', logsController.getUsageLog);
router.post('/usage', logsController.addUsageEntry);
router.delete('/usage/:id', logsController.deleteUsageEntry);

module.exports = router;
