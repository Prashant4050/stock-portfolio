import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    portfolioAPI.getTransactions()
      .then(res => setTransactions(res.data))
      .catch(() => toast.error('Failed to load transactions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.type === filter);
  const totalBought = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + t.total, 0);
  const totalSold = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + t.total, 0);

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Transactions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{transactions.length} total transactions</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Transactions', value: transactions.length, isNum: true },
          { label: 'Total Bought', value: formatCurrency(totalBought), color: 'var(--red)' },
          { label: 'Total Sold', value: formatCurrency(totalSold), color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color || 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['ALL', 'BUY', 'SELL'].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>≋</div>
          <h3>No transactions yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your trade history will appear here</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                        {t.type === 'BUY' ? '↑ BUY' : '↓ SELL'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.symbol}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.companyName}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{t.quantity}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(t.price)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.type === 'BUY' ? 'var(--red)' : 'var(--green)' }}>
                      {t.type === 'SELL' ? '+' : '-'}{formatCurrency(t.total)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDateTime(t.date)}</td>
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
