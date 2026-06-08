import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portfolioAPI, stocksAPI } from '../utils/api';
import { formatCurrency, formatPercent, getPnLClass } from '../utils/format';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, marketRes] = await Promise.all([
          portfolioAPI.get(),
          stocksAPI.market()
        ]);
        setPortfolio(portRes.data);
        setMarket(marketRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const holdings = portfolio?.portfolio?.holdings || [];
  const totalInvested = portfolio?.portfolio?.totalInvested || 0;
  const currentValue = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
  const totalPnL = currentValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const balance = portfolio?.balance || user?.balance || 0;
  const totalNet = balance + currentValue;

  // Mock sparkline data
  const generateSparkline = () => {
    const labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    let val = totalNet * 0.85;
    const data = labels.map(() => {
      val *= 1 + (Math.random() - 0.47) * 0.02;
      return +val.toFixed(2);
    });
    data[data.length - 1] = totalNet;
    return { labels, data };
  };
  const sparkline = generateSparkline();

  const chartData = {
    labels: sparkline.labels,
    datasets: [{
      data: sparkline.data,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: ctx => formatCurrency(ctx.raw) }
    }},
    scales: {
      x: { display: false },
      y: {
        display: true,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#4a5a75', callback: v => formatCurrency(v, 0) }
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}!</p>
        </div>
        <Link to="/market" className="btn btn-primary">+ Buy Stocks</Link>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Net Worth</div>
          <div className="stat-value">{formatCurrency(totalNet)}</div>
          <div className={`stat-change ${getPnLClass(totalPnL)}`}>
            {formatPercent(totalPnLPct)} overall
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Cash Balance</div>
          <div className="stat-value text-accent">{formatCurrency(balance)}</div>
          <div className="stat-sublabel">Available to invest</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-value">{formatCurrency(currentValue)}</div>
          <div className="stat-sublabel">{holdings.length} positions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unrealized P&L</div>
          <div className={`stat-value ${getPnLClass(totalPnL)}`}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </div>
          <div className={`stat-change ${getPnLClass(totalPnL)}`}>
            {formatPercent(totalPnLPct)}
          </div>
        </div>
      </div>

      {/* Chart + Market overview */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="flex-between mb-2">
            <h2 className="section-title">Net Worth Trend</h2>
            <span className="badge badge-accent">30 days</span>
          </div>
          <div style={{ height: '220px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-2">Market Indices</h2>
          {market?.indices && Object.values(market.indices).map(idx => (
            <div key={idx.name} className="index-row">
              <span className="index-name">{idx.name}</span>
              <div className="index-right">
                <span className="index-value">{idx.value.toLocaleString()}</span>
                <span className={`badge ${idx.change >= 0 ? 'badge-green' : 'badge-red'}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top movers */}
      <div className="dashboard-grid mt-2">
        <div className="card">
          <div className="flex-between mb-2">
            <h2 className="section-title">🚀 Top Gainers</h2>
            <Link to="/market" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {market?.gainers?.slice(0, 5).map(s => (
            <div key={s.symbol} className="mover-row">
              <div>
                <div className="mover-symbol">{s.symbol}</div>
                <div className="mover-name">{s.name}</div>
              </div>
              <div className="text-right">
                <div className="mover-price">{formatCurrency(s.price)}</div>
                <span className="badge badge-green">+{s.changePercent.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex-between mb-2">
            <h2 className="section-title">📉 Top Losers</h2>
            <Link to="/market" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {market?.losers?.slice(0, 5).map(s => (
            <div key={s.symbol} className="mover-row">
              <div>
                <div className="mover-symbol">{s.symbol}</div>
                <div className="mover-name">{s.name}</div>
              </div>
              <div className="text-right">
                <div className="mover-price">{formatCurrency(s.price)}</div>
                <span className="badge badge-red">{s.changePercent.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent holdings */}
      {holdings.length > 0 && (
        <div className="card mt-2">
          <div className="flex-between mb-2">
            <h2 className="section-title">Your Holdings</h2>
            <Link to="/portfolio" className="btn btn-ghost btn-sm">Full portfolio →</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Current</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.slice(0, 5).map(h => {
                  const pnl = (h.currentPrice - h.avgBuyPrice) * h.quantity;
                  const pnlPct = ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100;
                  return (
                    <tr key={h.symbol}>
                      <td>
                        <div className="mover-symbol">{h.symbol}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.companyName}</div>
                      </td>
                      <td className="font-mono">{h.quantity}</td>
                      <td className="font-mono">{formatCurrency(h.avgBuyPrice)}</td>
                      <td className="font-mono">{formatCurrency(h.currentPrice)}</td>
                      <td className={`font-mono ${getPnLClass(pnl)}`}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}<br/>
                        <small>{formatPercent(pnlPct)}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {holdings.length === 0 && (
        <div className="empty-state card mt-2">
          <div className="empty-icon">◈</div>
          <h3>No positions yet</h3>
          <p>Start building your portfolio by buying stocks</p>
          <Link to="/market" className="btn btn-primary mt-2">Explore Market →</Link>
        </div>
      )}
    </div>
  );
}
