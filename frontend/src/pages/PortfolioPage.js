import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../utils/api';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/format';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import SellModal from '../components/Portfolio/SellModal';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './Portfolio.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#00d4ff', '#00e676', '#7b61ff', '#ffd700', '#ff3d71', '#ff9800', '#e91e63', '#00bcd4'];

export default function PortfolioPage() {
  const { user, updateBalance } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellStock, setSellStock] = useState(null);

  const fetchPortfolio = async () => {
    try {
      const res = await portfolioAPI.get();
      setPortfolio(res.data);
      updateBalance(res.data.balance);
    } catch (err) {
      toast.error('Failed to load portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;

  const holdings = portfolio?.portfolio?.holdings || [];
  const totalInvested = portfolio?.portfolio?.totalInvested || 0;
  const currentValue = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
  const totalPnL = currentValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const realizedPnL = portfolio?.portfolio?.realizedPnL || 0;

  // Donut chart
  const donutData = {
    labels: holdings.map(h => h.symbol),
    datasets: [{
      data: holdings.map(h => h.currentPrice * h.quantity),
      backgroundColor: COLORS.slice(0, holdings.length),
      borderColor: 'var(--bg-card)',
      borderWidth: 3
    }]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#7a8ba8', font: { size: 12 }, boxWidth: 12, padding: 16 }
      },
      tooltip: {
        callbacks: { label: ctx => `${ctx.label}: ${formatCurrency(ctx.raw)}` }
      }
    }
  };

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-subtitle">{holdings.length} positions</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Current Value</div>
          <div className="stat-value">{formatCurrency(currentValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Invested</div>
          <div className="stat-value">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unrealized P&L</div>
          <div className={`stat-value ${getPnLClass(totalPnL)}`}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </div>
          <div className={`stat-change ${getPnLClass(totalPnL)}`}>{formatPercent(totalPnLPct)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Realized P&L</div>
          <div className={`stat-value ${getPnLClass(realizedPnL)}`}>
            {realizedPnL >= 0 ? '+' : ''}{formatCurrency(realizedPnL)}
          </div>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">◈</div>
          <h3>No holdings</h3>
          <p>Buy stocks from the Market page to build your portfolio</p>
        </div>
      ) : (
        <div className="portfolio-grid">
          {/* Holdings table */}
          <div className="card">
            <h2 className="section-title mb-2">Holdings</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Avg Buy</th>
                    <th>Current</th>
                    <th>Value</th>
                    <th>P&L</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => {
                    const pnl = (h.currentPrice - h.avgBuyPrice) * h.quantity;
                    const pnlPct = ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100;
                    return (
                      <tr key={h.symbol}>
                        <td>
                          <div className="mover-symbol">{h.symbol}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.companyName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.sector}</div>
                        </td>
                        <td className="font-mono">{h.quantity}</td>
                        <td className="font-mono">{formatCurrency(h.avgBuyPrice)}</td>
                        <td className="font-mono">{formatCurrency(h.currentPrice)}</td>
                        <td className="font-mono">{formatCurrency(h.currentPrice * h.quantity)}</td>
                        <td className={`font-mono ${getPnLClass(pnl)}`}>
                          <div>{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</div>
                          <div style={{ fontSize: '0.8rem' }}>{formatPercent(pnlPct)}</div>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setSellStock(h)}
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation chart */}
          <div className="card">
            <h2 className="section-title mb-2">Allocation</h2>
            <div style={{ height: '260px' }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {sellStock && (
        <SellModal
          stock={sellStock}
          balance={portfolio?.balance}
          onClose={() => setSellStock(null)}
          onSuccess={() => { setSellStock(null); fetchPortfolio(); }}
        />
      )}
    </div>
  );
}
