import React, { useState } from 'react';
import { portfolioAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function SellModal({ stock, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { updateBalance } = useAuth();

  const totalValue = quantity * stock.currentPrice;
  const pnl = (stock.currentPrice - stock.avgBuyPrice) * quantity;

  const handleSell = async () => {
    if (quantity < 1 || quantity > stock.quantity) {
      return toast.error(`Enter a quantity between 1 and ${stock.quantity}.`);
    }
    setLoading(true);
    try {
      const res = await portfolioAPI.sell({
        symbol: stock.symbol,
        quantity: Number(quantity),
        price: stock.currentPrice
      });
      updateBalance(res.data.balance);
      toast.success(`Sold ${quantity} shares of ${stock.symbol}!`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sell failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Sell {stock.symbol}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stock.companyName}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Price</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatCurrency(stock.currentPrice)}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Owned Shares</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{stock.quantity}</div>
            </div>
          </div>

          <label className="form-label">Quantity to sell</label>
          <input
            className="form-input"
            type="number"
            min={1}
            max={stock.quantity}
            value={quantity}
            onChange={e => setQuantity(Math.min(stock.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            {[1, Math.floor(stock.quantity / 2), stock.quantity].filter((v, i, a) => a.indexOf(v) === i).map(v => (
              <button key={v} className="btn btn-outline btn-sm" onClick={() => setQuantity(v)}>
                {v === stock.quantity ? 'All' : v}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total value</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatCurrency(totalValue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Est. P&L</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
            </span>
          </div>
        </div>

        <button className="btn btn-danger btn-lg btn-block" onClick={handleSell} disabled={loading}>
          {loading ? 'Processing...' : `Sell ${quantity} share${quantity > 1 ? 's' : ''} for ${formatCurrency(totalValue)}`}
        </button>
      </div>
    </div>
  );
}
