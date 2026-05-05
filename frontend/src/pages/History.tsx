import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';
import { getOrders, subscribeToOrders, type ActiveOrder } from '../services/orderService';
import './History.css';

export default function History() {
  const navigate = useNavigate();
  const [historyOrders, setHistoryOrders] = useState<ActiveOrder[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const storedIds = JSON.parse(localStorage.getItem('user_device_orders') || '[]');
      const allOrders = await getOrders();
      const myOrders = allOrders.filter(o => storedIds.includes(o.orderId));
      myOrders.sort((a, b) => b.timestamp - a.timestamp);
      setHistoryOrders(myOrders);
    };

    loadHistory();
    const unsubscribe = subscribeToOrders(loadHistory);
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      className="history-page"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <header className="history-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <span className="history-title">My Orders</span>
      </header>

      <main className="history-content">
        {historyOrders.length === 0 ? (
          <div className="history-empty">
            <Clock size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>You haven't placed any orders from this device yet.</p>
          </div>
        ) : (
          <div className="history-list">
            <AnimatePresence>
              {historyOrders.map(order => (
                <motion.div 
                  key={order.orderId}
                  className="hist-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/status/${order.orderId}`)}
                  layout
                >
                  <div className="hist-card-head">
                    <span className="hist-id">{order.orderId}</span>
                    <span className={`hist-status ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="hist-card-body">
                    <span className="hist-items">
                      {order.items.reduce((acc, item) => acc + item.qty, 0)} Items
                    </span>
                    <span className="hist-amount">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </motion.div>
  );
}
