const express = require('express');
const router = express.Router();
const { addStock, transferStock, updateStockQuantity, removeStockEntry } = require('../controllers/stockController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, addStock);
router.post('/transfer', authMiddleware, transferStock);
router.put('/update', authMiddleware, updateStockQuantity);
router.delete('/remove', authMiddleware, removeStockEntry);

module.exports = router;
