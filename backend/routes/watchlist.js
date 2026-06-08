const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const auth = require('../middleware/auth');

router.get('/', auth, watchlistController.getWatchlist);
router.post('/', auth, watchlistController.addToWatchlist);
router.delete('/:symbol', auth, watchlistController.removeFromWatchlist);
router.put('/:symbol', auth, watchlistController.updateWatchlistItem);

module.exports = router;
