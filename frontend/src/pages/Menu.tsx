import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, History as HistoryIcon, Moon, Sun } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCategories, getMenuItems, type Category, type MenuItem } from '../services/menuService';
import { getOrderById, type ActiveOrder } from '../services/orderService';
import { getSettings, subscribeToSettings } from '../services/settingsService';
import './Menu.css';

export default function Menu({ theme, toggleTheme }: { theme?: 'light' | 'dark', toggleTheme?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  
  const [cart, setCart] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('cart_session');
    if (saved) {
      try {
        const { data, timestamp } = JSON.parse(saved);
        if (Date.now() - timestamp < 3600000) return data;
        localStorage.removeItem('cart_session');
      } catch (e) { console.error(e); }
    }
    return {};
  });
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableNo = searchParams.get('table') || '12';
  const hotelId = searchParams.get('hotel') || localStorage.getItem('active_hotelId') || '';
  
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | undefined>();
  const [settings, setSettings] = useState<any>({
    hotelName: 'The Grand Kitchen',
    hotelLogo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=100&h=100',
    paymentFlow: 'BEFORE_EATING',
    currency: '₹',
  });

  const fetchData = async () => {
    const [catData, itemData, settingsData] = await Promise.all([
      getCategories(hotelId),
      getMenuItems(hotelId),
      getSettings(hotelId)
    ]);
    setCategories(catData);
    setMenuItems(itemData);
    setSettings(settingsData);
    if (catData.length > 0) setActiveCategory(catData[0].id);

    const activeOrderId = localStorage.getItem('active_session_orderId');
    if (activeOrderId) {
      const order = await getOrderById(activeOrderId, hotelId);
      setActiveOrder(order);
    }
  };

  useEffect(() => {
    if (searchParams.get('hotel')) {
      localStorage.setItem('active_hotelId', searchParams.get('hotel')!);
    }
    if (!hotelId) return; // Wait until hotel is known
    fetchData();
    return subscribeToSettings(fetchData);
  }, [hotelId]);

  useEffect(() => {
    localStorage.setItem('cart_session', JSON.stringify({
      data: cart,
      timestamp: Date.now()
    }));
  }, [cart]);

  const handleAdd = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const item = menuItems.find(m => m.id === id);
      return total + (item?.price || 0) * qty;
    }, 0);
  };

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Group items by category to render sections
  const itemsByCategory = categories.map(c => ({
    ...c,
    items: menuItems.filter(m => m.categoryId === c.id)
  })).filter(c => c.items.length > 0);

  if (!hotelId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', background: '#f8fafc', color: '#334155' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#0f172a' }}>Scan QR Code to Order</h1>
        <p style={{ maxWidth: '300px', lineHeight: 1.5 }}>Please scan the QR code on your table to view the menu and place your order.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="menu-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="header">
        {activeOrder && (
          <div 
            onClick={() => navigate(`/status/${activeOrder.orderId}`)}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
              <Clock size={18} />
              <span>Active Order: {activeOrder.status}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Track Order &rarr;</span>
          </div>
        )}
        <div className="header-top">
          <div className="hotel-info">
            <img 
              src={settings.hotelLogo} 
              alt="Hotel Logo" 
              className="hotel-logo" 
            />
            <div>
              <h1 className="heading-3" style={{ margin: 0 }}>{settings.hotelName}</h1>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Fine Dining & Bar</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {toggleTheme && (
              <button 
                onClick={toggleTheme}
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            )}
            <button 
              onClick={() => navigate('/history')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <HistoryIcon size={24} />
            </button>
            <div className="table-badge">Table {tableNo}</div>
          </div>
        </div>

        <div className="category-scroll">
          {categories.map(category => (
            <div 
              key={category.id}
              className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(category.id);
                document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {category.name}
            </div>
          ))}
        </div>
      </header>

      <main className="menu-list">
        {itemsByCategory.map(category => (
          <div key={category.id} id={`category-${category.id}`} className="menu-section">
            <h2 className="heading-2 section-title">{category.name}</h2>
            
            {category.items.map(item => (
              <motion.div 
                key={item.id} 
                className="menu-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="item-content">
                  <div className="item-header">
                    {item.type === 'veg' ? (
                      <div className="veg-indicator"><div className="veg-dot"></div></div>
                    ) : (
                      <div className="non-veg-indicator"><div className="non-veg-dot"></div></div>
                    )}
                    <span className="item-title">{item.name}</span>
                  </div>
                  <span className="item-price">₹{item.price}</span>
                  <p className="item-desc">{item.description}</p>
                </div>

                <div className="item-image-wrapper">
                  <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=140&fit=crop'} alt={item.name} className="item-image" loading="lazy" />
                  
                  {!cart[item.id] ? (
                    <button className="add-btn" onClick={() => handleAdd(item.id)}>
                      ADD
                    </button>
                  ) : (
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => handleRemove(item.id)}>-</button>
                      <span className="qty-text">{cart[item.id]}</span>
                      <button className="qty-btn" onClick={() => handleAdd(item.id)}>+</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </main>

      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.div 
            className="cart-floating-bar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => navigate('/checkout', { state: { cart, tableNo, hotelId } })}
          >
            <div className="cart-total">
              <span className="cart-items-count">{cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'}</span>
              <span className="cart-amount">₹{getCartTotal()}</span>
            </div>
            <div className="cart-view-btn">
              View Cart <ChevronRight size={18} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
