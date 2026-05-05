import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChefHat, Inbox, Coffee, RefreshCw } from 'lucide-react';
import {
  getOrders, updateOrderStatus, subscribeToOrders,
  type ActiveOrder, type OrderStatus,
} from '../services/orderService';
import { seedDemoOrders } from '../services/orderService';

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  return `${m}m ago`;
}

function Lane({
  title, status, orders, dotColor, titleColor, bgColor,
  onAdvance,
}: {
  title: string; status: OrderStatus; orders: ActiveOrder[];
  dotColor: string; titleColor: string; bgColor: string;
  onAdvance: (o: ActiveOrder) => void;
}) {
  const lane = orders.filter(o => o.status === status);
  const Icon = status === 'ORDERED' ? Inbox : status === 'PREPARING' ? ChefHat : CheckCircle2;

  return (
    <div className={`a-lane a-lane-${status.toLowerCase()}`}>
      <div className="a-lane-header">
        <div className="a-lane-dot" style={{ background: dotColor }} />
        <Icon size={14} color={titleColor} />
        <span className="a-lane-title" style={{ color: titleColor }}>{title}</span>
        <span className="a-lane-count" style={{ background: bgColor, color: titleColor }}>{lane.length}</span>
      </div>
      <div className="a-lane-body">
        <AnimatePresence mode="popLayout">
          {lane.length === 0 ? (
            <div className="a-lane-empty">
              <Coffee size={22} />
              <p>No orders here</p>
            </div>
          ) : lane.map(o => (
            <motion.div
              key={o.orderId}
              className="a-order-card"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22 }}
            >
              <div className="a-order-top">
                <span className="a-order-id">{o.orderId}</span>
                <span className="a-order-table">Table {o.tableNo}</span>
              </div>
              <div className="a-order-items">
                {o.items.map((item, i) => (
                  <div key={i} className="a-order-item">
                    <span className="a-order-qty">{item.qty}×</span>
                    <span style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--a-text)' }}>{item.name}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--a-border)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--a-text-dim)' }}>{timeAgo(o.timestamp)}</span>
                  <span style={{ color: 'var(--a-primary)', fontWeight: 700 }}>₹{o.totalAmount}</span>
                </div>
              </div>
              {o.status !== 'READY' && (
                <div className="a-order-footer">
                  <button
                    className={`a-order-btn ${o.status === 'ORDERED' ? 'start' : 'ready'}`}
                    onClick={() => onAdvance(o)}
                  >
                    <CheckCircle2 size={13} />
                    {o.status === 'ORDERED' ? 'Start Preparing' : 'Mark Ready'}
                  </button>
                </div>
              )}
              {o.status === 'READY' && (
                <div className="a-order-footer">
                  <button className="a-order-btn done" onClick={() => onAdvance(o)}>
                    <CheckCircle2 size={13} />Serve & Close
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminKitchen() {
  const hotelId = localStorage.getItem('active_hotelId') || '';
  const [orders, setOrders] = useState<ActiveOrder[]>([]);

  const load = useCallback(async () => {
    const data = await getOrders(hotelId);
    setOrders(data.filter(o => o.status !== 'SERVED'));
  }, [hotelId]);

  useEffect(() => {
    load();
    return subscribeToOrders(load);
  }, [load]);

  const advance = (o: ActiveOrder) => {
    const next: Record<string, OrderStatus> = {
      ORDERED: 'PREPARING', PREPARING: 'READY', READY: 'SERVED',
    };
    if (next[o.status]) updateOrderStatus(o.orderId, next[o.status]);
  };

  const lanes = [
    { title: 'Received',   status: 'ORDERED'   as OrderStatus, dotColor: '#F59E0B', titleColor: '#D97706', bgColor: 'rgba(245,158,11,0.1)' },
    { title: 'Preparing',  status: 'PREPARING' as OrderStatus, dotColor: '#4F46E5', titleColor: '#4F46E5', bgColor: 'rgba(79,70,229,0.08)' },
    { title: 'Ready',      status: 'READY'     as OrderStatus, dotColor: '#10B981', titleColor: '#10B981', bgColor: 'rgba(16,185,129,0.08)' },
  ];

  return (
    <div className="a-page">
      <div className="a-section-header" style={{ marginBottom: 0 }}>
        <div>
          <p className="a-section-title">Kitchen Monitor</p>
          <p className="a-section-sub">{orders.length} active orders · Live view</p>
        </div>
        <button className="a-btn a-btn-outline a-btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="a-kanban">
        {lanes.map(l => (
          <Lane key={l.status} {...l} orders={orders} onAdvance={advance} />
        ))}
      </div>
    </div>
  );
}
