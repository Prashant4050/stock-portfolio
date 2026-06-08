const Watchlist = require('../models/Watchlist');

exports.getWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.userId, stocks: [] });
    }
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.addToWatchlist = async (req, res) => {
  try {
    const { symbol, companyName, alertPrice, notes } = req.body;
    if (!symbol || !companyName) {
      return res.status(400).json({ message: 'Symbol and company name required.' });
    }

    let watchlist = await Watchlist.findOne({ user: req.userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.userId, stocks: [] });
    }

    const exists = watchlist.stocks.find(s => s.symbol === symbol.toUpperCase());
    if (exists) {
      return res.status(400).json({ message: 'Stock already in watchlist.' });
    }

    watchlist.stocks.push({
      symbol: symbol.toUpperCase(),
      companyName,
      alertPrice: alertPrice || null,
      notes: notes || ''
    });

    await watchlist.save();
    res.json({ message: `${symbol.toUpperCase()} added to watchlist.`, watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;
    const watchlist = await Watchlist.findOne({ user: req.userId });
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found.' });

    watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== symbol.toUpperCase());
    await watchlist.save();

    res.json({ message: `${symbol.toUpperCase()} removed from watchlist.`, watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateWatchlistItem = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { alertPrice, notes } = req.body;

    const watchlist = await Watchlist.findOne({ user: req.userId });
    const idx = watchlist?.stocks.findIndex(s => s.symbol === symbol.toUpperCase());

    if (idx === undefined || idx < 0) {
      return res.status(404).json({ message: 'Stock not found in watchlist.' });
    }

    if (alertPrice !== undefined) watchlist.stocks[idx].alertPrice = alertPrice;
    if (notes !== undefined) watchlist.stocks[idx].notes = notes;

    await watchlist.save();
    res.json({ message: 'Watchlist updated.', watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
