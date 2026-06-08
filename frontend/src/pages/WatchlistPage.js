import React, { useState, useEffect } from 'react';
import { watchlistAPI, stocksAPI } from '../utils/api';
import { formatCurrency, formatPercent } from '../utils/format';
import toast from 'react-hot-toast';
import './Watchlist.css';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [adding, setAdding] = useState(false);
  const debounceRef = React.useRef(null);

  const fetchWatchlist = async () => {
    try {
      const res = await watchlistAPI.get();
      setWatchlist(res.data);
    } catch { toast.error('Failed to load watchlist.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWatchlist(); }, []);

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

  const addStock = async (stock) => {
    setAdding(true);
    try {
      await watchlistAPI.add({ symbol: stock.symbol, companyName: stock.name });
      toast.success(`${stock.symbol} added to watchlist!`);
      setSearch('');
      setSearchResults([]);
      fetchWatchlist();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add.');
    } finally { setAdding(false); }
  };

  const removeStock = async (symbol) => {
    try {
      await watchlistAPI.remove(symbol);
      toast.success(`${symbol} removed from watchlist.`);
      fetchWatchlist();
    } catch {
      toast.error('Failed to remove.');
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;

  const stocks = watchlist?.stocks || [];

  return (
    <div className="watchlist-page">
      <div className="page-header mb-2">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">{stocks.length} stocks tracked</p>
        </div>
      </div>

      {/* Add stock search */}
      <div className="card add-stock-card mb-2">
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Add to Watchlist</h3>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="form-input"
              placeholder="Search by symbol or company name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map(s => (
                <div key={s.symbol} className="search-result" onClick={() => addStock(s)}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.symbol}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.name}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{formatCurrency(s.price)}</div>
                    <span className={`badge ${s.changePercent >= 0 ? 'badge-green' : 'badge-red'}`}>
                      {formatPercent(s.changePercent)}
                    </span>
                    <div style={{ marginTop: '0.25rem' }}>
                      <button className="btn btn-primary btn-sm" disabled={adding}>+ Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stocks.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">◉</div>
          <h3>Watchlist is empty</h3>
          <p>Search for stocks above to add them to your watchlist</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Added</th>
                  <th>Alert Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.symbol}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.symbol}</span>
                    </td>
                    <td>{s.companyName}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(s.addedAt).toLocaleDateString()}
                    </td>
                    <td>
                      {s.alertPrice ? (
                        <span className="badge badge-accent">{formatCurrency(s.alertPrice)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeStock(s.symbol)}
                        style={{ color: 'var(--red)' }}
                      >
                        ✕ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
