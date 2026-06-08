const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const auth = require('../middleware/auth');

router.get('/', auth, portfolioController.getPortfolio);
router.post('/buy', auth, portfolioController.buyStock);
router.post('/sell', auth, portfolioController.sellStock);
router.get('/transactions', auth, portfolioController.getTransactions);
router.post('/update-prices', auth, portfolioController.updatePrices);

module.exports = router;
