import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, IndianRupee, ChefHat, Clock, ArrowRight, Utensils, Download
} from 'lucide-react';
import { getOrders, getKitchenStats, clearAllOrders } from '../services/orderService';

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const hotelId = localStorage.getItem('active_hotelId') || '';
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalToday: 0, pendingCount: 0, avgPrepTimeMs: 0 });

  const fetchData = async () => {
    const [ordersData, statsData] = await Promise.all([
      getOrders(hotelId),
      getKitchenStats(hotelId)
    ]);
    setOrders(ordersData);
    setStats(statsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === 'SERVED' || o.status === 'READY')
    .reduce((s, o) => s + o.totalAmount, 0);

  const avgOrderValue = orders.length ? Math.round(totalRevenue / Math.max(orders.filter(o => o.status === 'SERVED').length, 1)) : 0;

  const recentOrders = [...orders].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  const topItems = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(item => {
      map[item.name] = (map[item.name] || 0) + item.qty;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [orders]);

  const cards = [
    { label: 'Total Orders',    value: stats.totalToday,           icon: ShoppingBag,  cls: 'primary', fmt: (v: number) => v.toString() },
    { label: 'Revenue Today',   value: totalRevenue,               icon: IndianRupee,  cls: 'success', fmt: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Active Orders',   value: stats.pendingCount,         icon: ChefHat,      cls: 'warning', fmt: (v: number) => v.toString() },
    { label: 'Avg Prep Time',   value: stats.avgPrepTimeMs / 60000, icon: Clock,       cls: 'info',    fmt: (v: number) => v > 0 ? `${v.toFixed(0)}m` : '—' },
  ];

  const statusColor: Record<string, string> = {
    ORDERED: '#F59E0B', PREPARING: '#4F46E5', READY: '#10B981', SERVED: '#9CA3AF',
  };

  const handleEOD = () => {
    if (!orders.length) return alert('No orders to generate report.');
    if (!confirm('This will download the End Of Day report and CLEAR all orders. Continue?')) return;

    let report = `END OF DAY REPORT\nDate: ${new Date().toLocaleDateString()}\n`;
    report += `Total Orders: ${stats.totalToday}\n`;
    report += `Total Revenue: Rs ${totalRevenue}\n`;
    report += `Avg Prep Time: ${Math.round(stats.avgPrepTimeMs / 60000)} mins\n\n`;
    report += `--- ORDER DETAILS ---\n`;
    orders.forEach(o => {
       report += `Order ${o.orderId} | Table ${o.tableNo} | Amount: Rs ${o.totalAmount} | Status: ${o.status}\n`;
       report += `   Items: ${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EOD_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    clearAllOrders();
    window.location.reload();
  };

  return (
    <div className="a-page">
      {/* Stats */}
      <div className="a-stats-grid">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            className="a-stat-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`a-stat-icon ${c.cls}`}><c.icon size={20} /></div>
            <div className="a-stat-info">
              <h3>{c.fmt(c.value)}</h3>
              <p>{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* Recent Orders */}
        <div>
          <div className="a-section-header" style={{ marginBottom: 12 }}>
            <div>
              <p className="a-section-title">Recent Orders</p>
              <p className="a-section-sub">{orders.length} orders this session</p>
            </div>
            <button className="a-btn a-btn-outline a-btn-sm" onClick={() => navigate('/admin/orders')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Order</th><th>Table</th><th>Items</th><th>Amount</th><th>Time</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--a-text-dim)' }}>No orders yet</td></tr>
                ) : recentOrders.map(o => (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 800 }}>{o.orderId}</td>
                    <td>Table {o.tableNo}</td>
                    <td style={{ color: 'var(--a-text-muted)' }}>{o.items.reduce((s, i) => s + i.qty, 0)} items</td>
                    <td style={{ fontWeight: 700 }}>₹{o.totalAmount}</td>
                    <td style={{ color: 'var(--a-text-muted)', fontSize: '0.8rem' }}>{timeAgo(o.timestamp)}</td>
                    <td>
                      <span
                        className="a-pill"
                        style={{ background: `${statusColor[o.status]}18`, color: statusColor[o.status] }}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Items */}
        <div>
          <div className="a-section-header" style={{ marginBottom: 12 }}>
            <div>
              <p className="a-section-title">Top Items</p>
              <p className="a-section-sub">Most ordered today</p>
            </div>
            <button className="a-btn a-btn-outline a-btn-sm" onClick={() => navigate('/admin/menu')}>
              Menu <ArrowRight size={13} />
            </button>
          </div>

          <div className="a-card">
            {topItems.length === 0 ? (
              <div className="a-card-body">
                <div className="a-empty" style={{ padding: '30px 0' }}>
                  <Utensils size={24} />
                  <p>No data yet</p>
                </div>
              </div>
            ) : (
              <div className="a-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topItems.map(([name, qty]) => {
                  const max = topItems[0][1];
                  const pct = Math.round((qty / max) * 100);
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--a-text)' }}>{name}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--a-primary)' }}>{qty} qty</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 999, background: 'var(--a-surface-2)', border: '1px solid var(--a-border)' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--a-primary), #8B5CF6)', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="a-section-title" style={{ marginBottom: 2 }}>Quick Actions</p>
            {[
              { label: 'Monitor Kitchen', icon: ChefHat,     path: '/admin/kitchen' },
              { label: 'Manage Orders',   icon: ShoppingBag, path: '/admin/orders' },
              { label: 'Manage Tables',   icon: Utensils,    path: '/admin/tables' },
            ].map(q => (
              <button
                key={q.path}
                className="a-btn a-btn-outline"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate(q.path)}
              >
                <q.icon size={16} />{q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avg order stats */}
      <div className="a-card">
        <div className="a-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p className="a-section-title">Session Summary</p>
            <p className="a-section-sub">Key metrics for the current session</p>
          </div>
          <button className="a-btn a-btn-outline" onClick={handleEOD}>
            <Download size={15} /> Download & Clear EOD
          </button>
        </div>
        <div className="a-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Avg Order Value',   value: avgOrderValue > 0 ? `₹${avgOrderValue}` : '—' },
            { label: 'Served',            value: orders.filter(o => o.status === 'SERVED').length },
            { label: 'Pending',           value: orders.filter(o => o.status !== 'SERVED').length },
            { label: 'Total Revenue',     value: `₹${totalRevenue.toLocaleString('en-IN')}` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--a-text)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
