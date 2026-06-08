// Mock stock data for demo (replace with real API like Alpha Vantage, Yahoo Finance, etc.)
const MOCK_STOCKS = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 189.30, change: 2.45, changePercent: 1.31, sector: 'Technology', marketCap: '2.95T', pe: 31.2, volume: '54.2M' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -0.95, changePercent: -0.67, sector: 'Technology', marketCap: '1.77T', pe: 25.8, volume: '23.1M' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.85, change: 5.20, changePercent: 1.39, sector: 'Technology', marketCap: '2.82T', pe: 35.1, volume: '21.4M' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 3.10, changePercent: 1.77, sector: 'Consumer Discretionary', marketCap: '1.85T', pe: 62.4, volume: '41.3M' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -8.75, changePercent: -3.40, sector: 'Automotive', marketCap: '790B', pe: 78.9, volume: '98.7M' },
  META: { symbol: 'META', name: 'Meta Platforms', price: 502.10, change: 12.30, changePercent: 2.51, sector: 'Technology', marketCap: '1.28T', pe: 27.3, volume: '18.9M' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.40, change: 22.15, changePercent: 2.60, sector: 'Technology', marketCap: '2.16T', pe: 68.5, volume: '42.1M' },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase', price: 198.70, change: 1.85, changePercent: 0.94, sector: 'Financials', marketCap: '572B', pe: 12.1, volume: '9.8M' },
  JNJ: { symbol: 'JNJ', name: 'Johnson & Johnson', price: 152.40, change: -0.60, changePercent: -0.39, sector: 'Healthcare', marketCap: '367B', pe: 14.8, volume: '7.5M' },
  V: { symbol: 'V', name: 'Visa Inc.', price: 274.90, change: 3.20, changePercent: 1.18, sector: 'Financials', marketCap: '558B', pe: 30.4, volume: '6.2M' },
  WMT: { symbol: 'WMT', name: 'Walmart Inc.', price: 68.45, change: 0.75, changePercent: 1.11, sector: 'Consumer Staples', marketCap: '551B', pe: 29.8, volume: '14.1M' },
  DIS: { symbol: 'DIS', name: 'Walt Disney Co.', price: 111.20, change: -1.30, changePercent: -1.16, sector: 'Communication', marketCap: '204B', pe: 45.2, volume: '11.2M' },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', price: 628.90, change: 15.40, changePercent: 2.51, sector: 'Communication', marketCap: '272B', pe: 45.8, volume: '5.1M' },
  BA: { symbol: 'BA', name: 'Boeing Co.', price: 198.30, change: -3.20, changePercent: -1.59, sector: 'Industrials', marketCap: '121B', pe: null, volume: '8.9M' },
  GS: { symbol: 'GS', name: 'Goldman Sachs', price: 448.60, change: 6.70, changePercent: 1.52, sector: 'Financials', marketCap: '145B', pe: 15.3, volume: '2.1M' }
};

// Add some randomness to simulate live prices
const addNoise = (price) => {
  const noise = (Math.random() - 0.5) * 0.02;
  return +(price * (1 + noise)).toFixed(2);
};

exports.searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json([]);
    }

    const query = q.toUpperCase();
    const results = Object.values(MOCK_STOCKS).filter(s =>
      s.symbol.includes(query) || s.name.toUpperCase().includes(query)
    ).slice(0, 8);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error searching stocks.' });
  }
};

exports.getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = MOCK_STOCKS[symbol.toUpperCase()];

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found.' });
    }

    // Simulate live price with small random fluctuation
    const livePrice = addNoise(stock.price);
    const liveChange = +(livePrice - stock.price + stock.change).toFixed(2);
    const liveChangePercent = +((liveChange / (stock.price - stock.change)) * 100).toFixed(2);

    res.json({ ...stock, price: livePrice, change: liveChange, changePercent: liveChangePercent });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching quote.' });
  }
};

exports.getMarketOverview = async (req, res) => {
  try {
    const topStocks = Object.values(MOCK_STOCKS).map(s => ({
      ...s,
      price: addNoise(s.price)
    }));

    const gainers = [...topStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const losers = [...topStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    const indices = {
      SP500: { name: 'S&P 500', value: 5048.42, change: 0.84 },
      NASDAQ: { name: 'NASDAQ', value: 15996.82, change: 1.25 },
      DOW: { name: 'Dow Jones', value: 38996.39, change: 0.42 }
    };

    res.json({ gainers, losers, indices, stocks: topStocks });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching market data.' });
  }
};

exports.getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1M' } = req.query;
    const stock = MOCK_STOCKS[symbol.toUpperCase()];

    if (!stock) return res.status(404).json({ message: 'Stock not found.' });

    const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period] || 30;
    const history = [];
    let price = stock.price * 0.85;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      price = +(price * (1 + (Math.random() - 0.48) * 0.025)).toFixed(2);
      history.push({
        date: date.toISOString().split('T')[0],
        open: +(price * 0.998).toFixed(2),
        high: +(price * 1.015).toFixed(2),
        low: +(price * 0.985).toFixed(2),
        close: price,
        volume: Math.floor(Math.random() * 50000000) + 5000000
      });
    }

    res.json({ symbol: symbol.toUpperCase(), history });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching history.' });
  }
};
