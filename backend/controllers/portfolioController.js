const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

// Get portfolio
exports.getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.userId, holdings: [], transactions: [] });
    }
    const user = await User.findById(req.userId);
    res.json({ portfolio, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching portfolio.' });
  }
};

// Buy stock
exports.buyStock = async (req, res) => {
  try {
    const { symbol, companyName, quantity, price, sector } = req.body;

    if (!symbol || !companyName || !quantity || !price) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const total = quantity * price;
    const user = await User.findById(req.userId);

    if (user.balance < total) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    let portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.userId, holdings: [], transactions: [] });
    }

    // Update or add holding
    const existingIdx = portfolio.holdings.findIndex(h => h.symbol === symbol.toUpperCase());
    if (existingIdx >= 0) {
      const existing = portfolio.holdings[existingIdx];
      const newQty = existing.quantity + quantity;
      const newAvg = ((existing.avgBuyPrice * existing.quantity) + (price * quantity)) / newQty;
      portfolio.holdings[existingIdx].quantity = newQty;
      portfolio.holdings[existingIdx].avgBuyPrice = newAvg;
      portfolio.holdings[existingIdx].currentPrice = price;
    } else {
      portfolio.holdings.push({
        symbol: symbol.toUpperCase(),
        companyName,
        quantity,
        avgBuyPrice: price,
        currentPrice: price,
        sector: sector || 'Unknown'
      });
    }

    // Add transaction
    portfolio.transactions.unshift({
      symbol: symbol.toUpperCase(),
      companyName,
      type: 'BUY',
      quantity,
      price,
      total,
      date: new Date()
    });

    portfolio.totalInvested += total;
    await portfolio.save();

    // Deduct balance
    user.balance -= total;
    await user.save();

    res.json({ message: `Successfully bought ${quantity} shares of ${symbol}`, portfolio, balance: user.balance });
  } catch (error) {
    console.error('Buy stock error:', error);
    res.status(500).json({ message: 'Server error during purchase.' });
  }
};

// Sell stock
exports.sellStock = async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;

    if (!symbol || !quantity || !price) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    let portfolio = await Portfolio.findOne({ user: req.userId });
    const holdingIdx = portfolio?.holdings.findIndex(h => h.symbol === symbol.toUpperCase());

    if (holdingIdx === undefined || holdingIdx < 0) {
      return res.status(400).json({ message: 'Stock not found in portfolio.' });
    }

    const holding = portfolio.holdings[holdingIdx];
    if (holding.quantity < quantity) {
      return res.status(400).json({ message: `You only have ${holding.quantity} shares.` });
    }

    const total = quantity * price;
    const pnl = (price - holding.avgBuyPrice) * quantity;

    // Update holding
    if (holding.quantity === quantity) {
      portfolio.holdings.splice(holdingIdx, 1);
    } else {
      portfolio.holdings[holdingIdx].quantity -= quantity;
      portfolio.holdings[holdingIdx].currentPrice = price;
    }

    // Add transaction
    portfolio.transactions.unshift({
      symbol: symbol.toUpperCase(),
      companyName: holding.companyName,
      type: 'SELL',
      quantity,
      price,
      total,
      date: new Date()
    });

    portfolio.realizedPnL += pnl;
    portfolio.totalInvested -= holding.avgBuyPrice * quantity;
    await portfolio.save();

    // Add balance
    const user = await User.findById(req.userId);
    user.balance += total;
    await user.save();

    res.json({ message: `Successfully sold ${quantity} shares of ${symbol}`, portfolio, balance: user.balance, pnl });
  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(500).json({ message: 'Server error during sale.' });
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.userId });
    const transactions = portfolio?.transactions || [];
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching transactions.' });
  }
};

// Update current prices (called periodically)
exports.updatePrices = async (req, res) => {
  try {
    const { prices } = req.body; // { AAPL: 150.25, GOOGL: 2800.50, ... }
    const portfolio = await Portfolio.findOne({ user: req.userId });
    if (!portfolio) return res.json({ message: 'No portfolio found.' });

    portfolio.holdings.forEach(holding => {
      if (prices[holding.symbol]) {
        holding.currentPrice = prices[holding.symbol];
      }
    });

    await portfolio.save();
    res.json({ message: 'Prices updated.', portfolio });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating prices.' });
  }
};
