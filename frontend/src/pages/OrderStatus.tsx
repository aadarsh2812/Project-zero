import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Utensils, CreditCard, ChevronRight } from 'lucide-react';
import { getOrderById, subscribeToOrders, updateOrderPayment, type ActiveOrder, type OrderStatus } from '../services/orderService';
import { getSettings } from '../services/settingsService';
import { openRazorpay } from '../services/razorpayService';
import { speakText } from '../utils/speech';
import './OrderStatus.css';

export default function OrderStatusPage() {
  const { orderId }  = useParams<{ orderId: string }>();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [order, setOrder]     = useState<ActiveOrder | undefined>();
  const [isPaying, setIsPaying] = useState(false);
  const [settings, setSettings] = useState<any>({ hotelName: 'Restaurant', currency: '₹', razorpayKeyId: '' });

  // Track previous status via ref to detect changes without adding to deps array
  const prevStatusRef = useRef<string | undefined>(undefined);

  const hotelId = location.state?.hotelId || localStorage.getItem('active_hotelId') || '';

  // Load settings for Razorpay key and currency
  useEffect(() => {
    if (hotelId) {
      getSettings(hotelId).then(setSettings);
    }
  }, [hotelId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    const updatedOrder = await getOrderById(orderId, hotelId || undefined);

    // Announce status change via speech — compare against ref, NOT state
    if (updatedOrder && prevStatusRef.current && updatedOrder.status !== prevStatusRef.current) {
      if (updatedOrder.status === 'READY') {
        speakText('Your order is ready to serve. Enjoy your meal!');
      } else if (updatedOrder.status === 'PREPARING') {
        speakText('The kitchen has started preparing your order.');
      }
    }
    if (updatedOrder) prevStatusRef.current = updatedOrder.status;
    setOrder(updatedOrder);
  };

  useEffect(() => {
    fetchOrder();
    const unsubscribe = subscribeToOrders(fetchOrder);

    // Poll every 5 seconds — fixed interval, NOT recreated on status change
    const intervalId = setInterval(fetchOrder, 5000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
    // Only re-create on orderId change — NOT order?.status
  }, [orderId]);

  if (!order) {
    return (
      <div className="status-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Clock size={40} style={{ color: 'var(--primary)', opacity: 0.5 }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading order…</p>
      </div>
    );
  }

  const handlePayBill = async () => {
    setIsPaying(true);
    openRazorpay({
      keyId:       settings.razorpayKeyId,
      amount:      order.totalAmount,
      name:        settings.hotelName,
      description: `Bill Payment — Order ${order.orderId} · Table ${order.tableNo}`,
      onSuccess: async () => {
        // Mark payment as PAID in the backend
        await updateOrderPayment(order.orderId, 'PAID', 'ONLINE');
        setIsPaying(false);
        localStorage.removeItem('active_session_orderId');
        navigate('/success', { replace: true });
      },
      onDismiss: () => {
        setIsPaying(false);
      },
    });
    setIsPaying(false); // reset after Razorpay modal opens
  };

  const getStepClass = (stepStatus: OrderStatus) => {
    if (order.status === stepStatus) return 'active';
    if (
      (stepStatus === 'ORDERED'   && (order.status === 'PREPARING' || order.status === 'READY' || order.status === 'SERVED')) ||
      (stepStatus === 'PREPARING' && (order.status === 'READY'     || order.status === 'SERVED')) ||
      (stepStatus === 'READY'     &&  order.status === 'SERVED')
    ) {
      return 'completed';
    }
    return '';
  };

  return (
    <motion.div
      className="status-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="status-header">
        <h2>Order <span>{order.orderId}</span></h2>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
          Table {order.tableNo}
        </div>
      </header>

      <main className="status-content">
        <h1 className="heading-1">Track Order</h1>
        <p className="text-muted">Live updates directly from the kitchen.</p>

        <div className="timeline">
          <motion.div className={`timeline-step ${getStepClass('ORDERED')}`}   initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className={`step-icon ${order.status === 'ORDERED' ? 'animating' : ''}`}><Check size={18} strokeWidth={3} /></div>
            <div className="step-content">
              <h3 className="step-title">Order Received</h3>
              <p className="step-desc">Your order has been sent to the kitchen.</p>
            </div>
          </motion.div>

          <motion.div className={`timeline-step ${getStepClass('PREPARING')}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className={`step-icon ${order.status === 'PREPARING' ? 'animating' : ''}`}><Clock size={18} strokeWidth={2.5} /></div>
            <div className="step-content">
              <h3 className="step-title">Preparing</h3>
              <p className="step-desc">The chef is cooking your delicious food.</p>
            </div>
          </motion.div>

          <motion.div className={`timeline-step ${getStepClass('READY')}`}     initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className={`step-icon ${order.status === 'READY' ? 'animating' : ''}`}><Utensils size={18} strokeWidth={2.5} /></div>
            <div className="step-content">
              <h3 className="step-title">Ready to Serve</h3>
              <p className="step-desc">Your food is ready and being brought to your table.</p>
            </div>
          </motion.div>
        </div>

        <motion.div className="order-details-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <h3 className="heading-3" style={{ marginBottom: '16px' }}>Bill Summary</h3>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>{item.qty}x {item.name}</span>
              <span>{settings.currency}{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--border)', margin: '16px 0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
            <span>Grand Total</span>
            <span>{settings.currency}{order.totalAmount.toFixed(2)}</span>
          </div>
        </motion.div>
      </main>

      {/* Floating Payment Bar */}
      <motion.div
        className="payment-floating-bar"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total to Pay</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{settings.currency}{order.totalAmount.toFixed(2)}</span>
        </div>

        {order.paymentStatus === 'PAID' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-foreground)', background: 'var(--success-light)', padding: '10px 16px', borderRadius: '12px', fontWeight: 600 }}>
            <Check size={18} /> Paid
          </div>
        ) : (
          <button
            className="btn-primary"
            onClick={handlePayBill}
            disabled={isPaying}
          >
            {isPaying ? 'Opening Payment…' : (
              <>
                <CreditCard size={18} />
                Pay Bill <ChevronRight size={18} />
              </>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
