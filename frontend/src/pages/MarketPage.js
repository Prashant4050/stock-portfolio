import React, { useState, useEffect, useRef } from 'react';
import { stocksAPI, portfolioAPI } from '../utils/api';
import { formatCurrency, formatPercent } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import './Market.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function MarketPage() {
  const { user, updateBalance } = useAuth();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState('1M');
  const [buyQty, setBuyQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    stocksAPI.market().then(res => setAllStocks(res.data.stocks || []));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await stocksAPI.search(search);
        setSearchResults(res.data);
      } catch {}
    }, 300);
  }, [search]);

  const fetchHistory = async (symbol, p = period) => {
    try {
      setLoading(true);
      const res = await stocksAPI.history(symbol, p);
      setHistory(res.data.history || []);
    } catch {}
    finally { setLoading(false); }
  };

  const selectStock = async (stock) => {
    setSelectedStock(stock);
    setSearch('');
    setSearchResults([]);
    setBuyQty(1);
    await fetchHistory(stock.symbol, period);
  };

  const changePeriod = async (p) => {
    setPeriod(p);
    if (selectedStock) await fetchHistory(selectedStock.symbol, p);
  };

  const handleBuy = async () => {
    if (!selectedStock || buyQty < 1) return;
    const total = buyQty * selectedStock.price;
    if (total > (user?.balance || 0)) {
      return toast.error('Insufficient balance!');
    }
    setBuying(true);
    try {
      const res = await portfolioAPI.buy({
        symbol: selectedStock.symbol,
        companyName: selectedStock.name,
        quantity: Number(buyQty),
        price: selectedStock.price,
        sector: selectedStock.sector
      });
      updateBalance(res.data.balance);
      toast.success(`Bought ${buyQty} shares of ${selectedStock.symbol}!`);
      setBuyQty(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed.');
    } finally {
      setBuying(false);
    }
  };

  const chartData = {
    labels: history.map(h => h.date),
    datasets: [{
      data: history.map(h => h.close),
      borderColor: selectedStock?.changePercent >= 0 ? '#00e676' : '#ff3d71',
      backgroundColor: selectedStock?.changePercent >= 0 ? 'rgba(0,230,118,0.05)' : 'rgba(255,61,113,0.05)',
      fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: ctx => formatCurrency(ctx.raw) }
    }},
    scales: {
      x: { display: false },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4a5a75', callback: v => formatCurrency(v, 0) } }
    }
  };

  const totalCost = buyQty * (selectedStock?.price || 0);
  const canAfford = totalCost <= (user?.balance || 0);

  return (
    <div className="market-page">
      <div className="page-header mb-2">
        <div>
          <h1 className="page-title">Market</h1>
          <p className="page-subtitle">Search and buy stocks</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrapper" ref={searchRef}>
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search stocks by symbol or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map(s => (
              <div key={s.symbol} className="search-result" onClick={() => selectStock(s)}>
                <div>
                  <div className="result-symbol">{s.symbol}</div>
                  <div className="result-name">{s.name}</div>
                </div>
                <div className="text-right">
                  <div className="result-price">{formatCurrency(s.price)}</div>
                  <span className={`badge ${s.changePercent >= 0 ? 'badge-green' : 'badge-red'}`}>
                    {formatPercent(s.changePercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="market-grid">
        {/* Stock detail + buy panel */}
        {selectedStock ? (
          <div className="stock-detail">
            <div className="card stock-header-card">
              <div className="stock-header">
                <div>
                  <div className="stock-symbol-lg">{selectedStock.symbol}</div>
                  <div className="stock-name-lg">{selectedStock.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedStock.sector}</div>
                </div>
                <div className="text-right">
                  <div className="stock-price-lg">{formatCurrency(selectedStock.price)}</div>
                  <span className={`badge ${selectedStock.changePercent >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.875rem', padding: '0.3rem 0.75rem' }}>
                    {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.change?.toFixed(2)} ({formatPercent(selectedStock.changePercent)})
                  </span>
                </div>
              </div>

              <div className="stock-meta">
                <div className="meta-item"><span>Market Cap</span><span>{selectedStock.marketCap}</span></div>
                <div className="meta-item"><span>P/E Ratio</span><span>{selectedStock.pe || 'N/A'}</span></div>
                <div className="meta-item"><span>Volume</span><span>{selectedStock.volume}</span></div>
              </div>
            </div>

            {/* Chart */}
            <div className="card">
              <div className="flex-between mb-2">
                <h3 style={{ fontWeight: 600 }}>Price History</h3>
                <div className="period-btns">
                  {['1W','1M','3M','6M','1Y'].map(p => (
                    <button key={p} className={`period-btn ${period === p ? 'period-active' : ''}`} onClick={() => changePeriod(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ height: '200px' }}>
                {loading ? <div className="flex-center" style={{ height: '100%' }}><div className="spinner" /></div>
                  : <Line data={chartData} options={chartOptions} />}
              </div>
            </div>

            {/* Buy panel */}
            <div className="card buy-panel">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Place Order</h3>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={buyQty}
                  onChange={e => setBuyQty(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="order-summary">
                <div className="order-row">
                  <span>Price per share</span>
                  <span>{formatCurrency(selectedStock.price)}</span>
                </div>
                <div className="order-row">
                  <span>Shares</span>
                  <span>{buyQty}</span>
                </div>
                <div className="order-row order-total">
                  <span>Total Cost</span>
                  <span style={{ color: canAfford ? 'var(--text-primary)' : 'var(--red)' }}>{formatCurrency(totalCost)}</span>
                </div>
                <div className="order-row">
                  <span>Balance after</span>
                  <span style={{ color: canAfford ? 'var(--green)' : 'var(--red)' }}>
                    {formatCurrency(Math.max(0, (user?.balance || 0) - totalCost))}
                  </span>
                </div>
              </div>

              {!canAfford && <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Insufficient balance</p>}

              <button
                className="btn btn-success btn-lg btn-block"
                onClick={handleBuy}
                disabled={buying || !canAfford}
              >
                {buying ? 'Buying...' : `Buy ${buyQty} share${buyQty > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="card no-stock-selected flex-center" style={{ flexDirection: 'column', gap: '0.5rem', height: '300px' }}>
            <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>◉</span>
            <p style={{ color: 'var(--text-secondary)' }}>Search for a stock to view details</p>
          </div>
        )}

        {/* All stocks list */}
        <div className="card stocks-list">
          <h2 className="section-title mb-2">All Stocks</h2>
          {allStocks.map(s => (
            <div key={s.symbol} className={`stock-row ${selectedStock?.symbol === s.symbol ? 'stock-row-active' : ''}`} onClick={() => selectStock(s)}>
              <div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{s.symbol}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.name}</div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600 }}>{formatCurrency(s.price)}</div>
                <span className={`badge ${s.changePercent >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.72rem' }}>
                  {formatPercent(s.changePercent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
