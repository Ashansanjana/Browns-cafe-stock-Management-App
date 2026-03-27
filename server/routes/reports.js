const express = require('express');
const router = express.Router();
const { getMonthlyReport } = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/monthly', authMiddleware, getMonthlyReport);

module.exports = router;
