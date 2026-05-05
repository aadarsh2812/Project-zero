import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, ChefHat, Utensils,
  BarChart3, LogOut, ExternalLink, Settings
} from 'lucide-react';
import AdminAuth from './AdminAuth';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminKitchen from './AdminKitchen';
import AdminMenu from './AdminMenu';
import AdminTables from './AdminTables';
import AdminSettings from './AdminSettings';
import { getOrders } from '../services/orderService';
import { getHotels, subscribeToSuperAdmin } from '../services/superAdminService';
import './AdminApp.css';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      fontVariantNumeric: 'tabular-nums',
      fontSize: '0.82rem',
      fontWeight: 700,
      color: 'var(--a-text-muted)',
      background: 'var(--a-surface-2)',
      padding: '5px 12px',
      borderRadius: 8,
      border: '1px solid var(--a-border)',
    }}>
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  );
}

export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const auth      = sessionStorage.getItem('admin_auth') === 'true';
  const userRaw   = sessionStorage.getItem('admin_user');
  const user      = userRaw ? JSON.parse(userRaw) : { username: 'admin', role: 'Super Admin', initials: 'SA' };

  const [activeCount, setActiveCount] = useState(0);
  const [tenantStatus, setTenantStatus] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ hotelName: 'AdminOS' });

  const fetchTenant = async () => {
    const activeHotelId = localStorage.getItem('active_hotelId');
    if (!activeHotelId) return;
    const hotels = await getHotels();
    const hotel = hotels.find(h => h.id === activeHotelId) || null;
    setTenantStatus(hotel);
    if (hotel) setSettings({ hotelName: hotel.name, hotelLogo: hotel.logo });
  };

  const updateActiveCount = async () => {
    const activeHotelId = localStorage.getItem('active_hotelId');
    if (!activeHotelId) return;
    const orders = await getOrders(activeHotelId);
    setActiveCount(orders.filter(o => o.status !== 'SERVED').length);
  };

  useEffect(() => {
    fetchTenant();
    return subscribeToSuperAdmin(fetchTenant);
  }, []);

  useEffect(() => {
    updateActiveCount();
    const id = setInterval(updateActiveCount, 5000);
    return () => clearInterval(id);
  }, []);

  const isActive = (path: string) => location.pathname.includes(path);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_user');
    navigate('/admin/login', { replace: true });
  };

  const pages: Record<string, { title: string; sub: string }> = {
    dashboard: { title: '🏠 Dashboard',         sub: 'Overview & key metrics' },
    orders:    { title: '📦 Order Management',   sub: 'View and manage all orders' },
    kitchen:   { title: '🍳 Kitchen Monitor',    sub: 'Live order queue' },
    menu:      { title: '🍽️ Menu Management',    sub: 'Add, edit and toggle menu items' },
    tables:    { title: '🪑 Table Management',   sub: 'Manage dine-in tables' },
    settings:  { title: '⚙️ Settings',           sub: 'App configuration and branding' },
  };

  const currentPage = Object.keys(pages).find(p => location.pathname.includes(p)) ?? 'dashboard';
  const pageInfo    = pages[currentPage];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'orders',    label: 'Orders',           icon: ShoppingBag,     path: '/admin/orders',   badge: activeCount || undefined },
    { id: 'kitchen',   label: 'Kitchen Monitor',  icon: ChefHat,         path: '/admin/kitchen' },
    { id: 'menu',      label: 'Menu',             icon: Utensils,        path: '/admin/menu' },
    { id: 'tables',    label: 'Tables',           icon: BarChart3,       path: '/admin/tables' },
    { id: 'settings',  label: 'Settings',         icon: Settings,        path: '/admin/settings'},
  ];

  if (tenantStatus && tenantStatus.status === 'PAUSED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0f172a' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Access Suspended</h1>
        <p style={{ color: '#64748b' }}>Your hotel's software access has been temporarily suspended by the Super Administrator.</p>
        <button className="a-btn a-btn-outline" style={{ marginTop: '20px' }} onClick={handleLogout}>Log Out</button>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {auth && (
        <nav className="a-sidebar">
          {/* Brand */}
          <div className="a-brand">
            <div className="a-brand-icon">
              {settings.hotelLogo ? <img src={settings.hotelLogo} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : '🏨'}
            </div>
            <div className="a-brand-text">
              <h2>AdminOS</h2>
              <p>{settings.hotelName}</p>
            </div>
          </div>

          {/* Nav */}
          <div className="a-nav-section">
            <p className="a-nav-label">Main</p>
            {navItems.map(item => (
              <div
                key={item.id}
                id={`a-nav-${item.id}`}
                className={`a-nav-item ${isActive(item.id) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(item.path)}
              >
                <item.icon size={16} />
                {item.label}
                {item.badge ? <span className="a-nav-badge">{item.badge}</span> : null}
              </div>
            ))}

            <div className="a-nav-divider" />
            <p className="a-nav-label">Quick Links</p>

            <div className="a-nav-item" onClick={() => window.open('/', '_blank')} role="button" tabIndex={0}>
              <ExternalLink size={15} />
              Customer Menu
            </div>
            <div className="a-nav-item" onClick={() => window.open('/kitchen/dashboard', '_blank')} role="button" tabIndex={0}>
              <ExternalLink size={15} />
              Kitchen Display
            </div>
          </div>

          {/* Bottom */}
          <div className="a-sidebar-bottom">
            <div className="a-user-card">
              <div className="a-user-avatar">{user.initials}</div>
              <div className="a-user-info">
                <h4>{user.username}</h4>
                <p>{user.role}</p>
              </div>
            </div>
            <button id="a-logout-btn" className="a-logout-btn" onClick={handleLogout}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </nav>
      )}

      <main className={`a-main ${!auth ? 'full-width' : ''}`}>
        {auth && tenantStatus?.paymentDue && (
          <div style={{ background: '#ef4444', color: 'white', padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '0.85rem' }}>
            Warning: Your SaaS platform subscription is overdue. Please contact the administrator.
          </div>
        )}
        {auth && (
          <header className="a-topbar">
            <div className="a-topbar-left">
              <h1>{pageInfo?.title}</h1>
              <p>{pageInfo?.sub}</p>
            </div>
            <div className="a-topbar-right">
              <div className="a-topbar-pill">
                <span />
                {activeCount > 0 ? `${activeCount} Active Orders` : 'All Clear'}
              </div>
              <LiveClock />
            </div>
          </header>
        )}

        <Routes>
          <Route path="login"     element={!auth ? <AdminAuth /> : <Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={auth ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
          <Route path="orders"    element={auth ? <AdminOrders />   : <Navigate to="/admin/login" replace />} />
          <Route path="kitchen"   element={auth ? <AdminKitchen />  : <Navigate to="/admin/login" replace />} />
          <Route path="menu"      element={auth ? <AdminMenu />     : <Navigate to="/admin/login" replace />} />
          <Route path="tables"    element={auth ? <AdminTables />   : <Navigate to="/admin/login" replace />} />
          <Route path="settings"  element={auth ? <AdminSettings /> : <Navigate to="/admin/login" replace />} />
          <Route path="*"         element={<Navigate to={auth ? '/admin/dashboard' : '/admin/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}
