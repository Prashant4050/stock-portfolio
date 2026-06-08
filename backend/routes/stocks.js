const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

router.get('/search', auth, stockController.searchStocks);
router.get('/market', auth, stockController.getMarketOverview);
router.get('/:symbol/quote', auth, stockController.getStockQuote);
router.get('/:symbol/history', auth, stockController.getStockHistory);

module.exports = router;
