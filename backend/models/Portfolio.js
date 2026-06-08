const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  avgBuyPrice: { type: Number, required: true },
  currentPrice: { type: Number, default: 0 },
  sector: { type: String, default: 'Unknown' }
});

const transactionSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  holdings: [holdingSchema],
  transactions: [transactionSchema],
  totalInvested: { type: Number, default: 0 },
  realizedPnL: { type: Number, default: 0 }
}, { timestamps: true });

// Virtual for total current value
portfolioSchema.virtual('totalCurrentValue').get(function() {
  return this.holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
