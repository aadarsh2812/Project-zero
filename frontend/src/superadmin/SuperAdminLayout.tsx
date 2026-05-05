import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, LogOut, ShieldAlert } from 'lucide-react';
import SuperAdminAuth from './SuperAdminAuth';
import SuperDashboard from './SuperDashboard';
import SuperHotels from './SuperHotels';
import SuperBilling from './SuperBilling';
import './SuperAdminApp.css';

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = sessionStorage.getItem('superadmin_auth') === 'true';

  const handleLogout = () => {
    sessionStorage.removeItem('superadmin_auth');
    navigate('/superadmin/login', { replace: true });
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/superadmin/dashboard' },
    { id: 'hotels',    label: 'Hotel Tenants', icon: Building2, path: '/superadmin/hotels' },
    { id: 'billing',   label: 'Billing & Alerts', icon: CreditCard, path: '/superadmin/billing' },
  ];

  if (!auth && !location.pathname.includes('/login')) {
    return <Navigate to="/superadmin/login" replace />;
  }

  if (!auth) {
    return <SuperAdminAuth />;
  }

  const currentPage = navItems.find(n => location.pathname.includes(n.id))?.label || 'Dashboard';

  return (
    <div className="sa-root">
      <nav className="sa-sidebar">
        <div className="sa-brand">
          <div className="sa-brand-icon"><ShieldAlert size={20} /></div>
          <div className="sa-brand-text">
            <h2>AdminOS Cloud</h2>
            <p>Super Administrator</p>
          </div>
        </div>

        <div className="sa-nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`sa-nav-item ${location.pathname.includes(item.id) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              role="button"
            >
              <item.icon size={18} />
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          <button className="sa-btn sa-btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={16} /> Secure Logout
          </button>
        </div>
      </nav>

      <main className="sa-main">
        <header className="sa-header">
          <h1>{currentPage}</h1>
        </header>

        <Routes>
          <Route path="dashboard" element={<SuperDashboard />} />
          <Route path="hotels"    element={<SuperHotels />} />
          <Route path="billing"   element={<SuperBilling />} />
          <Route path="*"         element={<Navigate to="/superadmin/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
