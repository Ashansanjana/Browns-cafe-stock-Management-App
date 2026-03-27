const express = require('express');
const router = express.Router();
const { getAllOutlets, getOutletById, getOutletStock } = require('../controllers/outletsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllOutlets);
router.get('/:id', authMiddleware, getOutletById);
router.get('/:id/stock', authMiddleware, getOutletStock);

module.exports = router;
