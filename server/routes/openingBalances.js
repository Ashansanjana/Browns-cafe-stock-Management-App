const express = require('express');
const router = express.Router();
const openingBalancesController = require('../controllers/openingBalancesController');

router.get('/', openingBalancesController.getOpeningBalances);
router.post('/', openingBalancesController.upsertOpeningBalance);

module.exports = router;
