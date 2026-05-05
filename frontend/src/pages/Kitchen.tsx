import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, CheckSquare, Clock, Coffee } from 'lucide-react';
import { getOrders, subscribeToOrders, updateOrderStatus, type ActiveOrder } from '../services/orderService';
import { speakText } from '../utils/speech';
import './Kitchen.css';

export default function Kitchen() {
  const [orders, setOrders] = useState<ActiveOrder[]>(getOrders());

  useEffect(() => {
    let prevOrdersLength = getOrders().length;

    const handleUpdate = () => {
      const newOrders = getOrders();
      setOrders(newOrders);

      // Check if new order arrived
      if (newOrders.length > prevOrdersLength) {
        speakText('New order received. Please check the ticket.');
      }
      prevOrdersLength = newOrders.length;
    };

    const unsubscribe = subscribeToOrders(handleUpdate);
    return () => unsubscribe();
  }, []);

  const pendingOrders = orders.filter(o => o.status === 'ORDERED' || o.status === 'PREPARING');

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    if (currentStatus === 'ORDERED') {
      updateOrderStatus(orderId, 'PREPARING');
    } else if (currentStatus === 'PREPARING') {
      updateOrderStatus(orderId, 'READY');
    }
  };

  return (
    <div className="kitchen-page">
      <header className="kitchen-header">
        <div className="kitchen-title">
          <ChefHat size={28} />
          Kitchen Display System
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
          {pendingOrders.length} Active Orders
        </div>
      </header>

      <main className="kitchen-content">
        {pendingOrders.length === 0 ? (
          <div className="empty-kitchen">
            <div className="empty-icon"><Coffee size={40} /></div>
            <h2>No active orders right now</h2>
            <p>Wait for new tickets to appear here.</p>
          </div>
        ) : (
          <div className="orders-grid">
            <AnimatePresence>
              {pendingOrders.map(order => (
                <motion.div 
                  key={order.orderId}
                  className="k-order-card"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  layout
                >
                  <div className="k-card-header">
                    <span className="k-order-id">{order.orderId}</span>
                    <span className="k-table-badge">T{order.tableNo}</span>
                  </div>
                  <div className="k-card-body">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="k-item-row">
                        <span className="k-item-qty">{item.qty}x</span>
                        <span style={{ flex: 1 }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="k-card-footer">
                    {order.status === 'ORDERED' ? (
                      <button 
                        className="k-btn k-btn-prepare"
                        onClick={() => handleUpdateStatus(order.orderId, order.status)}
                      >
                        <Clock size={20} /> Mark as Preparing
                      </button>
                    ) : (
                      <button 
                        className="k-btn k-btn-ready"
                        onClick={() => handleUpdateStatus(order.orderId, order.status)}
                      >
                        <CheckSquare size={20} /> Mark as Ready
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
