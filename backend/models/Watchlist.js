const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  alertPrice: { type: Number, default: null },
  notes: { type: String, default: '' }
});

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stocks: [watchlistItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
