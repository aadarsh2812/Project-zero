import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, ChefHat, Inbox,
  Flame, BarChart3, Trash2, Coffee, Zap, Bell, BellOff,
} from 'lucide-react';
import {
  getOrders, updateOrderStatus, subscribeToOrders, deleteOrder,
  seedDemoOrders, refreshQueuePriority, isRushOrder, elapsedDisplay,
  type ActiveOrder, type OrderStatus,
} from '../services/orderService';

// ---- Toast helpers ----
interface Toast { id: number; message: string; type: 'new-order' | 'status-update'; }
let toastId = 0;

// ---- Timer hook ----
function useTick(ms = 1000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

// ---- Card timer ----
function OrderTimer({ timestamp, status }: { timestamp: number; status: OrderStatus }) {
  useTick(1000);
  const elapsed = elapsedDisplay(timestamp);
  const isUrgent = Date.now() - timestamp > 15 * 60000 && status !== 'READY';
  return (
    <span className={`k-card-timer ${isUrgent ? 'urgent' : ''}`}>
      <Clock size={12} />
      {elapsed}
      {isUrgent && <Flame size={12} />}
    </span>
  );
}

// ---- Individual Order Card ----
function OrderCard({
  order,
  onAdvance,
  onDelete,
}: {
  order: ActiveOrder;
  onAdvance: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}) {
  const rush = isRushOrder(order.orderId);

  const advanceLabel = order.status === 'ORDERED'
    ? 'Start Preparing'
    : order.status === 'PREPARING'
    ? 'Mark Ready'
    : 'Mark Served';

  const advanceBtnClass = order.status === 'ORDERED'
    ? 'k-action-btn k-btn-start'
    : order.status === 'PREPARING'
    ? 'k-action-btn k-btn-ready'
    : 'k-action-btn k-btn-done';

  const nextStatus: OrderStatus =
    order.status === 'ORDERED'   ? 'PREPARING' :
    order.status === 'PREPARING' ? 'READY' : 'SERVED';

  return (
    <motion.div
      layout
      key={order.orderId}
      className="k-order-card"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={rush ? { borderColor: 'rgba(245,158,11,0.35)' } : {}}
    >
      {/* Top row */}
      <div className="k-card-top">
        <span className="k-card-order-id">{order.orderId}</span>
        <span className="k-card-table">Table {order.tableNo}</span>
      </div>

      {/* Meta (timer + rush badge) */}
      <div className="k-card-meta">
        <OrderTimer timestamp={order.timestamp} status={order.status} />
        {rush && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, color: 'var(--k-received)', background: 'var(--k-received-soft)', padding: '2px 8px', borderRadius: 999 }}>
            <Zap size={10} /> RUSH
          </span>
        )}
      </div>

      {/* Items */}
      <div className="k-card-items">
        {order.items.map((item, i) => (
          <div key={i} className="k-card-item">
            <span className="k-card-item-qty">{item.qty}×</span>
            <span className="k-card-item-name">{item.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--k-text-dim)', marginLeft: 'auto' }}>
              ₹{item.price * item.qty}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--k-border)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--k-text-muted)' }}>
          Total ₹{order.totalAmount}
        </div>
      </div>

      {/* Footer actions */}
      <div className="k-card-footer">
        <button
          id={`k-advance-${order.orderId}`}
          className={advanceBtnClass}
          onClick={() => onAdvance(order.orderId, nextStatus)}
        >
          <CheckCircle2 size={14} />
          {advanceLabel}
        </button>
        <button
          className="k-btn-icon-only"
          onClick={() => onDelete(order.orderId)}
          title="Remove order"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// ---- Lane ----
function Lane({
  title, status, orders, colorClass, icon: Icon,
  onAdvance, onDelete,
}: {
  title: string;
  status: OrderStatus;
  orders: ActiveOrder[];
  colorClass: string;
  icon: React.ElementType;
  onAdvance: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}) {
  const laneOrders = orders.filter(o => o.status === status);

  return (
    <div className={`k-lane ${colorClass}`}>
      <div className="k-lane-header">
        <div className="k-lane-dot" />
        <Icon size={15} />
        <span className="k-lane-title">{title}</span>
        <span className="k-lane-count">{laneOrders.length}</span>
      </div>

      <div className="k-lane-body">
        <AnimatePresence mode="popLayout">
          {laneOrders.length === 0 ? (
            <div className="k-lane-empty">
              <Coffee size={28} />
              <p>No orders here</p>
            </div>
          ) : (
            laneOrders.map(order => (
              <OrderCard
                key={order.orderId}
                order={order}
                onAdvance={onAdvance}
                onDelete={onDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- KanbanBoard (main export) ----
export default function KanbanBoard() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const prevCountRef = useRef(0);

  // No demo seed — hotels are managed via Super Admin portal

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const hotelId = localStorage.getItem('active_hotelId') || '';

  const loadOrders = useCallback(async () => {
    const orders = await getOrders(hotelId);
    const fresh = orders.filter(o => o.status !== 'SERVED');
    setOrders(fresh);

    if (fresh.length > prevCountRef.current) {
      addToast(`New order received! 🔔`, 'new-order');
      if (soundOn) {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        } catch { /* ignore */ }
      }
    }
    prevCountRef.current = fresh.length;
  }, [addToast, soundOn, hotelId]);

  useEffect(() => {
    loadOrders();
    const unsub = subscribeToOrders(loadOrders);
    
    // Poll every 5 seconds to catch new orders from customers across devices
    const interval = setInterval(() => {
      refreshQueuePriority();
      loadOrders();
    }, 5000);
    
    return () => { unsub(); clearInterval(interval); };
  }, [loadOrders]);

  const handleAdvance = (orderId: string, nextStatus: OrderStatus) => {
    // Optimistic UI update: instantly update local state
    setOrders(prev => prev.map(order => 
      order.orderId === orderId ? { ...order, status: nextStatus } : order
    ));
    addToast(`Order ${orderId} moved to ${nextStatus}`, 'status-update');
    
    // Fire backend request in background
    updateOrderStatus(orderId, nextStatus).then(() => {
      loadOrders();
    }).catch(err => {
      // Revert on failure
      loadOrders();
    });
  };

  const handleDelete = (orderId: string) => {
    if (confirm(`Remove order ${orderId}? This cannot be undone.`)) {
      deleteOrder(orderId);
      loadOrders();
    }
  };

  const lanes = [
    { title: 'Received',   status: 'ORDERED'   as OrderStatus, colorClass: 'k-lane-received',  icon: Inbox },
    { title: 'Preparing',  status: 'PREPARING' as OrderStatus, colorClass: 'k-lane-preparing', icon: ChefHat },
    { title: 'Ready',      status: 'READY'     as OrderStatus, colorClass: 'k-lane-ready',     icon: CheckCircle2 },
  ];

  return (
    <>
      {/* Stats bar */}
      <div className="k-stats-bar">
        {[
          { label: 'Received',  value: orders.filter(o => o.status === 'ORDERED').length,   cls: 'yellow', icon: Inbox },
          { label: 'Preparing', value: orders.filter(o => o.status === 'PREPARING').length, cls: 'indigo', icon: ChefHat },
          { label: 'Ready',     value: orders.filter(o => o.status === 'READY').length,     cls: 'green',  icon: CheckCircle2 },
          { label: 'Total Active', value: orders.length,                                    cls: 'red',    icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="k-stat-card">
            <div className={`k-stat-icon ${s.cls}`}><s.icon size={18} /></div>
            <div className="k-stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sound toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 24px 0' }}>
        <button
          className="k-sound-btn"
          onClick={() => setSoundOn(s => !s)}
          title={soundOn ? 'Mute alerts' : 'Unmute alerts'}
        >
          {soundOn ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
      </div>

      {/* Board */}
      <div className="k-board">
        {lanes.map(lane => (
          <Lane
            key={lane.status}
            {...lane}
            orders={orders}
            onAdvance={handleAdvance}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Toasts */}
      <div className="k-toast-container">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              className={`k-toast ${t.type}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
            >
              {t.type === 'new-order' ? <Bell size={16} /> : <CheckCircle2 size={16} />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
