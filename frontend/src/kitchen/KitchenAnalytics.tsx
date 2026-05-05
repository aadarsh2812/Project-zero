import { useState, useEffect, useMemo } from 'react';
import { getOrders, getKitchenStats } from '../services/orderService';
import { TrendingUp, Clock, CheckCircle2, ListOrdered, Award } from 'lucide-react';

function formatDuration(ms: number): string {
  if (ms <= 0) return '—';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function KitchenAnalytics() {
  const hotelId = localStorage.getItem('active_hotelId') || '';
  const [stats, setStats] = useState<any>({ totalToday: 0, servedToday: 0, pendingCount: 0, avgPrepTimeMs: 0 });
  const [orders, setOrders] = useState<any[]>([]);

  const fetchData = async () => {
    const [statsData, ordersData] = await Promise.all([
      getKitchenStats(hotelId),
      getOrders(hotelId)
    ]);
    setStats(statsData);
    setOrders(ordersData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const topItems = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(item => {
      map[item.name] = (map[item.name] || 0) + item.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  const metrics = [
    { label: 'Total Orders',   value: stats.totalToday,    unit: '',   icon: ListOrdered, cls: 'indigo' },
    { label: 'Served',         value: stats.servedToday,   unit: '',   icon: CheckCircle2, cls: 'green' },
    { label: 'Still Active',   value: stats.pendingCount,  unit: '',   icon: TrendingUp,  cls: 'yellow' },
    { label: 'Avg Prep Time',  value: formatDuration(stats.avgPrepTimeMs), unit: '', icon: Clock, cls: 'red' },
  ];

  return (
    <div className="k-analytics">
      {/* Headline metrics */}
      <div>
        <p className="k-section-title">Session Overview</p>
        <div className="k-analytics-grid">
          {metrics.map(m => (
            <div key={m.label} className="k-metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className={`k-stat-icon ${m.cls}`} style={{ width: 32, height: 32, borderRadius: 8 }}>
                  <m.icon size={16} />
                </div>
                <span className="k-metric-label">{m.label}</span>
              </div>
              <div className="k-metric-value">{m.value}{m.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Items */}
      {topItems.length > 0 && (
        <div>
          <p className="k-section-title"><Award size={12} style={{ display: 'inline', marginRight: 5 }} />Top Items Today</p>
          <div className="k-history-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty Ordered</th>
                  <th>Popularity</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map(([name, qty], i) => {
                  const max = topItems[0][1];
                  const pct = Math.round((qty / max) * 100);
                  return (
                    <tr key={name}>
                      <td style={{ color: 'var(--k-text-dim)', width: 36 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{qty}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--k-surface-3)' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
                          </div>
                          <span style={{ fontSize: '0.73rem', color: 'var(--k-text-muted)', width: 36, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order History */}
      <div>
        <p className="k-section-title">All Orders This Session ({orders.length})</p>
        <div className="k-history-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Placed</th>
                <th>Prep Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...orders].reverse().map(order => {
                const prepMs = order.prepStartedAt && order.readyAt
                  ? order.readyAt - order.prepStartedAt : 0;
                return (
                  <tr key={order.orderId}>
                    <td style={{ fontWeight: 800, letterSpacing: '0.03em' }}>{order.orderId}</td>
                    <td>Table {order.tableNo}</td>
                    <td>{order.items.reduce((s, i) => s + i.qty, 0)} items</td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>₹{order.totalAmount}</td>
                    <td style={{ color: 'var(--k-text-muted)', fontSize: '0.82rem' }}>{formatTime(order.timestamp)}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--k-text-muted)', fontSize: '0.82rem' }}>
                      {formatDuration(prepMs)}
                    </td>
                    <td>
                      <span className={`k-status-pill ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
