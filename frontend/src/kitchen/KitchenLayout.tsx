import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, LayoutDashboard, BarChart3, LogOut } from 'lucide-react';
import KitchenAuth from './KitchenAuth';
import KanbanBoard from './KanbanBoard';
import KitchenAnalytics from './KitchenAnalytics';
import { getHotels, subscribeToSuperAdmin } from '../services/superAdminService';
import './KitchenApp.css';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="k-time-display">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  );
}

export default function KitchenLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const auth      = sessionStorage.getItem('kitchen_auth') === 'true';
  const userRaw   = sessionStorage.getItem('kitchen_user');
  const user      = userRaw ? JSON.parse(userRaw) : { username: 'kitchen', role: 'Kitchen Staff', initials: 'KS' };

  const [tenantStatus, setTenantStatus] = useState<any>(null);

  const fetchTenantStatus = async () => {
    const activeHotelId = localStorage.getItem('active_hotelId');
    if (!activeHotelId) return;
    const hotels = await getHotels();
    setTenantStatus(hotels.find(h => h.id === activeHotelId) || null);
  };

  useEffect(() => {
    fetchTenantStatus();
    return subscribeToSuperAdmin(fetchTenantStatus);
  }, []);



  const isActive = (path: string) => location.pathname.includes(path);

  const handleLogout = () => {
    sessionStorage.removeItem('kitchen_auth');
    sessionStorage.removeItem('kitchen_user');
    navigate('/kitchen/login', { replace: true });
  };

  const topbarTitles: Record<string, { title: string; sub: string }> = {
    dashboard: { title: '🍳 Order Queue',   sub: 'Live 3-column Kanban view' },
    analytics: { title: '📊 Analytics',     sub: 'Session stats & order history' },
  };

  const currentPage = location.pathname.includes('analytics') ? 'analytics' : 'dashboard';
  const pageInfo    = topbarTitles[currentPage];

  if (tenantStatus && tenantStatus.status === 'PAUSED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#f8fafc' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Kitchen Access Suspended</h1>
        <p style={{ color: '#94a3b8' }}>This restaurant's software access has been temporarily suspended by the platform administrator.</p>
        <button className="k-btn k-btn-outline" style={{ marginTop: '20px' }} onClick={handleLogout}>Log Out</button>
      </div>
    );
  }

  return (
    <div className="kitchen-app-root">
      {/* Sidebar — only visible when authenticated */}
      {auth && (
        <nav className="k-sidebar">
          {/* Brand */}
          <div className="k-brand">
            <div className="k-brand-icon">
              <ChefHat size={22} />
            </div>
            <div className="k-brand-text">
              <h2>KitchenOS</h2>
              <p>v2.0 · Display System</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="k-nav-section">
            <p className="k-nav-label">Main Menu</p>

            <div
              id="k-nav-dashboard"
              className={`k-nav-item ${isActive('dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/kitchen/dashboard')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/kitchen/dashboard')}
            >
              <LayoutDashboard size={17} />
              Dashboard
            </div>

            <div
              id="k-nav-analytics"
              className={`k-nav-item ${isActive('analytics') ? 'active' : ''}`}
              onClick={() => navigate('/kitchen/analytics')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/kitchen/analytics')}
            >
              <BarChart3 size={17} />
              Analytics
            </div>
          </div>

          <div className="k-nav-divider" />

          {/* Bottom: User + Logout */}
          <div className="k-sidebar-bottom">
            <div className="k-user-card">
              <div className="k-user-avatar">{user.initials}</div>
              <div className="k-user-info">
                <h4>{user.username}</h4>
                <p>{user.role}</p>
              </div>
            </div>

            <button id="k-logout-btn" className="k-logout-btn" onClick={handleLogout}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </nav>
      )}

      {auth && tenantStatus?.paymentDue && (
        <div style={{ background: '#ef4444', color: 'white', padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '0.8rem', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
          Warning: SaaS subscription overdue. Please contact restaurant administration.
        </div>
      )}

      {/* Main area */}
      <main className={`k-main-content ${!auth ? 'full-width' : ''}`} style={{ paddingTop: (auth && tenantStatus?.paymentDue) ? '34px' : '0' }}>

        {/* Top bar */}
        {auth && (
          <header className="k-topbar">
            <div className="k-topbar-left">
              <h1>{pageInfo?.title}</h1>
              <p>{pageInfo?.sub}</p>
            </div>
            <div className="k-topbar-right">
              <div className="k-status-dot">
                <span />
                Kitchen Online
              </div>
              <Clock />
            </div>
          </header>
        )}

        {/* Routes */}
        <Routes>
          <Route
            path="login"
            element={!auth ? <KitchenAuth /> : <Navigate to="/kitchen/dashboard" replace />}
          />
          <Route
            path="dashboard"
            element={auth ? <KanbanBoard /> : <Navigate to="/kitchen/login" replace />}
          />
          <Route
            path="analytics"
            element={auth ? <KitchenAnalytics /> : <Navigate to="/kitchen/login" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={auth ? '/kitchen/dashboard' : '/kitchen/login'} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}
