import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RefreshCw, ChevronDown,
  Clock, CheckCircle2, Trash2, Eye, X,
} from 'lucide-react';
import {
  getOrders, updateOrderStatus, deleteOrder, subscribeToOrders, updateOrderPayment,
  type ActiveOrder, type OrderStatus,
} from '../services/orderService';

const STATUS_OPTS: (OrderStatus | 'ALL')[] = ['ALL', 'ORDERED', 'PREPARING', 'READY', 'SERVED'];

const STATUS_COLOR: Record<string, string> = {
  ORDERED: 'ordered', PREPARING: 'preparing', READY: 'ready', SERVED: 'served',
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function elapsed(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return '<1m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

interface DetailOrder extends ActiveOrder { }

export default function AdminOrders() {
  const hotelId = localStorage.getItem('active_hotelId') || '';
  const [orders, setOrders]       = useState<ActiveOrder[]>([]);
  const [filter, setFilter]       = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch]       = useState('');
  const [detail, setDetail]       = useState<DetailOrder | null>(null);
  const [toast, setToast]         = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    const data = await getOrders(hotelId);
    setOrders(data);
  }, [hotelId]);

  useEffect(() => {
    load();
    return subscribeToOrders(load);
  }, [load]);

  const filtered = orders
    .filter(o => filter === 'ALL' || o.status === filter)
    .filter(o =>
      !search ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.tableNo.includes(search) ||
      o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const advance = (o: ActiveOrder) => {
    const next: Record<string, OrderStatus> = {
      ORDERED: 'PREPARING', PREPARING: 'READY', READY: 'SERVED',
    };
    if (next[o.status]) {
      updateOrderStatus(o.orderId, next[o.status]);
      showToast(`${o.orderId} → ${next[o.status]}`);
      if (detail?.orderId === o.orderId) setDetail({ ...o, status: next[o.status] });
    }
  };

  const remove = (orderId: string) => {
    if (!confirm(`Remove order ${orderId}?`)) return;
    deleteOrder(orderId);
    if (detail?.orderId === orderId) setDetail(null);
    showToast(`${orderId} removed`);
  };

  const counts = STATUS_OPTS.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="a-page">
      {/* Header */}
      <div className="a-section-header">
        <div>
          <p className="a-section-title">Order Management</p>
          <p className="a-section-sub">{orders.length} orders this session</p>
        </div>
        <button className="a-btn a-btn-outline a-btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="a-filter-bar">
        <div className="a-search-wrap">
          <Search size={15} className="a-search-icon" />
          <input
            className="a-search-input"
            placeholder="Search by order ID, table, or item…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_OPTS.map(s => (
            <button
              key={s}
              className={`a-btn a-btn-sm ${filter === s ? 'a-btn-primary' : 'a-btn-outline'}`}
              onClick={() => setFilter(s)}
            >
              {s === 'ALL' ? 'All' : s} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({counts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Placed</th>
              <th>Wait</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: 'var(--a-text-dim)' }}>
                    No orders found
                  </td>
                </tr>
              ) : filtered.map(o => (
                <motion.tr
                  key={o.orderId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td style={{ fontWeight: 800 }}>{o.orderId}</td>
                  <td>Table {o.tableNo}</td>
                  <td style={{ color: 'var(--a-text-muted)' }}>
                    {o.items.map(i => `${i.qty}× ${i.name}`).join(', ').slice(0, 40)}
                    {o.items.length > 2 ? '…' : ''}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{o.totalAmount}</td>
                  <td style={{ color: 'var(--a-text-muted)', fontSize: '0.82rem' }}>{formatTime(o.timestamp)}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--a-text-muted)', fontSize: '0.82rem' }}>
                    <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {elapsed(o.timestamp)}
                  </td>
                  <td>
                    <span className={`a-pill ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                  </td>
                  <td>
                    <span className={`a-pill ${o.paymentStatus === 'PAID' ? 'active' : 'ordered'}`} style={{ opacity: o.paymentStatus === 'PAID' ? 1 : 0.8 }}>
                      {o.paymentStatus} {o.paymentStatus === 'PAID' && o.paymentMethod === 'CASH' && '(Cash)'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        className="a-btn a-btn-ghost a-btn-sm a-btn-icon"
                        onClick={() => setDetail(o)}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      {o.status !== 'SERVED' && (
                        <button
                          className="a-btn a-btn-success a-btn-sm"
                          onClick={() => advance(o)}
                          title="Advance status"
                        >
                          <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                          {o.status === 'ORDERED' ? 'Prepare' : o.status === 'PREPARING' ? 'Ready' : 'Serve'}
                        </button>
                      )}
                      <button
                        className="a-btn a-btn-danger a-btn-sm a-btn-icon"
                        onClick={() => remove(o.orderId)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div
            className="a-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDetail(null)}
          >
            <motion.div
              className="a-modal"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1,    opacity: 1, y: 0 }}
              exit={{ scale: 0.95,    opacity: 0, y: 10 }}
              transition={{ duration: 0.22 }}
            >
              <div className="a-modal-header">
                <span className="a-modal-title">Order {detail.orderId} · Table {detail.tableNo}</span>
                <button className="a-btn a-btn-ghost a-btn-icon" onClick={() => setDetail(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="a-modal-body">
                <p style={{ fontSize: '0.78rem', color: 'var(--a-text-muted)', marginBottom: 14 }}>
                  Placed at {formatTime(detail.timestamp)}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {detail.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--a-surface-2)', borderRadius: 'var(--a-radius-sm)', border: '1px solid var(--a-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="a-order-qty">{item.qty}×</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--a-primary)' }}>₹{item.qty * item.price}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--a-primary-light)', borderRadius: 'var(--a-radius-sm)', border: '1px solid rgba(79,70,229,0.15)' }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--a-primary)', fontSize: '1.05rem' }}>₹{detail.totalAmount}</span>
                </div>
                {detail.paymentStatus === 'PENDING' && (
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="a-btn a-btn-success" onClick={() => {
                       updateOrderPayment(detail.orderId, 'PAID', 'CASH');
                       setDetail({ ...detail, paymentStatus: 'PAID', paymentMethod: 'CASH' });
                       showToast(`Payment collected for ${detail.orderId}`);
                    }}>
                      Collect Cash Payment
                    </button>
                  </div>
                )}
              </div>
              <div className="a-modal-footer">
                <button className="a-btn a-btn-outline" onClick={() => setDetail(null)}>Close</button>
                {detail.status !== 'SERVED' && (
                  <button className="a-btn a-btn-primary" onClick={() => { advance(detail); setDetail(null); }}>
                    <CheckCircle2 size={15} />
                    {detail.status === 'ORDERED' ? 'Start Preparing' : detail.status === 'PREPARING' ? 'Mark Ready' : 'Mark Served'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="a-toast-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="a-toast"><CheckCircle2 size={15} style={{ color: 'var(--a-success)' }} />{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
