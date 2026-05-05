import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Utensils } from 'lucide-react';
import { getMenuItems, type MenuItem } from '../services/menuService';
import { saveOrder, updateOrderPayment, type ActiveOrder } from '../services/orderService';
import { getSettings, subscribeToSettings } from '../services/settingsService';
import { openRazorpay } from '../services/razorpayService';
import './Checkout.css';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [settings, setSettings] = useState<any>({
    hotelName: 'Restaurant',
    hotelLogo: '',
    paymentFlow: 'BEFORE_EATING',
    currency: '₹',
    razorpayKeyId: '',
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // ── Read context from navigation state (passed from Menu.tsx) ──
  const cart: Record<string, number> = location.state?.cart || {};
  const tableNo: string  = location.state?.tableNo || localStorage.getItem('active_tableNo') || '1';
  const hotelId: string  = location.state?.hotelId  || localStorage.getItem('active_hotelId') || '';

  const fetchData = async () => {
    if (!hotelId) return;
    const [items, settingsData] = await Promise.all([
      getMenuItems(hotelId),
      getSettings(hotelId),
    ]);
    setMenuItems(items);
    setSettings(settingsData);
  };

  useEffect(() => {
    // Persist tableNo so OrderStatus page can read it
    if (tableNo) localStorage.setItem('active_tableNo', tableNo);
    fetchData();
    return subscribeToSettings(fetchData);
  }, [hotelId]);

  const cartKeys = Object.keys(cart);

  if (cartKeys.length === 0) {
    return (
      <div className="checkout-page animate-fade-in">
        <header className="checkout-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <span className="checkout-title">Checkout</span>
        </header>
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <button className="btn-primary empty-btn" onClick={() => navigate(-1)}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cartKeys.reduce((total, id) => {
    const item = menuItems.find(m => m.id === id);
    return total + (item?.price || 0) * cart[id];
  }, 0);

  const cgst       = subtotal * 0.025;
  const sgst       = subtotal * 0.025;
  const grandTotal = subtotal + cgst + sgst;

  // ── Build the order object ──
  const buildOrder = (orderId: string): ActiveOrder => ({
    orderId,
    tableNo,
    status:        'ORDERED',
    totalAmount:   grandTotal,
    timestamp:     Date.now(),
    paymentStatus: 'PENDING',
    items: cartKeys.map(id => ({
      id,
      menuItemId: id,
      name:  menuItems.find(m => m.id === id)?.name || 'Unknown',
      qty:   cart[id],
      price: menuItems.find(m => m.id === id)?.price || 0,
    })),
  });

  const persistOrderSession = (orderId: string) => {
    localStorage.removeItem('cart_session');
    localStorage.setItem('active_session_orderId', orderId);
    const deviceOrders = JSON.parse(localStorage.getItem('user_device_orders') || '[]');
    deviceOrders.push(orderId);
    localStorage.setItem('user_device_orders', JSON.stringify(deviceOrders));
  };

  // ── BEFORE_EATING: pay first, then kitchen gets the order ──
  const handleBeforeEating = async () => {
    setIsProcessing(true);
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const order   = buildOrder(orderId);

    // 1. Save order as PENDING payment first
    await saveOrder(order, hotelId);
    persistOrderSession(orderId);

    // 2. Open Razorpay
    openRazorpay({
      keyId:       settings.razorpayKeyId,
      amount:      grandTotal,
      name:        settings.hotelName,
      description: `Order ${orderId} — Table ${tableNo}`,
      onSuccess: async () => {
        // 3. Mark payment as PAID
        await updateOrderPayment(orderId, 'PAID', 'ONLINE');
        setIsProcessing(false);
        navigate('/success', { replace: true, state: { nextSteps: 'TRACK', orderId } });
      },
      onDismiss: async () => {
        // Payment cancelled — remove the order and let customer retry
        // (order stays in DB as PENDING; kitchen won't pick it up)
        setIsProcessing(false);
      },
    });

    // Reset processing if Razorpay opens (don't block UI behind the modal)
    setIsProcessing(false);
  };

  // ── AFTER_EATING: kitchen gets order immediately, pay at the end ──
  const handleAfterEating = async () => {
    setIsProcessing(true);
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const order   = buildOrder(orderId);

    await saveOrder(order, hotelId);
    persistOrderSession(orderId);

    setIsProcessing(false);
    navigate(`/status/${orderId}`, { replace: true, state: { hotelId } });
  };

  const handlePlaceOrder = () => {
    if (settings.paymentFlow === 'BEFORE_EATING') {
      handleBeforeEating();
    } else {
      handleAfterEating();
    }
  };

  return (
    <motion.div
      className="checkout-page"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <header className="checkout-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <span className="checkout-title">Review Order</span>
      </header>

      <main className="checkout-content">
        <div className="bill-card">
          <h3 className="bill-title">Order Summary · Table {tableNo}</h3>

          {cartKeys.map(id => {
            const item = menuItems.find(m => m.id === id);
            if (!item) return null;
            return (
              <div key={id} className="bill-item">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">x{cart[id]}</span>
                <span className="item-total">{settings.currency}{(item.price * cart[id]).toFixed(2)}</span>
              </div>
            );
          })}

          <div className="bill-divider" />

          <div className="bill-row">
            <span>Subtotal</span>
            <span>{settings.currency}{subtotal.toFixed(2)}</span>
          </div>
          <div className="bill-row">
            <span>CGST (2.5%)</span>
            <span>{settings.currency}{cgst.toFixed(2)}</span>
          </div>
          <div className="bill-row">
            <span>SGST (2.5%)</span>
            <span>{settings.currency}{sgst.toFixed(2)}</span>
          </div>

          <div className="bill-total">
            <span>Grand Total</span>
            <span>{settings.currency}{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="payment-section">
          <div className="payment-info" style={{ background: 'var(--success-light)', color: 'var(--success-foreground)' }}>
            <Clock size={20} />
            <span>
              {settings.paymentFlow === 'BEFORE_EATING'
                ? 'You will complete payment via Razorpay before the kitchen starts preparing your food.'
                : 'Order now and pay your total bill at the end of your meal.'}
            </span>
          </div>

          <button
            className="btn-primary"
            onClick={handlePlaceOrder}
            disabled={isProcessing || !hotelId}
          >
            {isProcessing ? 'Processing…' : (
              <>
                <Utensils size={20} />
                {settings.paymentFlow === 'BEFORE_EATING' ? `Pay ${settings.currency}${grandTotal.toFixed(2)} & Order` : 'Send to Kitchen'}
              </>
            )}
          </button>

          {!settings.razorpayKeyId && settings.paymentFlow === 'BEFORE_EATING' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              ⚠️ Payment gateway not configured. Contact the restaurant manager.
            </p>
          )}
        </div>
      </main>
    </motion.div>
  );
}
