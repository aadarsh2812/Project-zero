import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderStatusPage from './pages/OrderStatus';
import PostPaymentSuccess from './pages/PostPaymentSuccess';
import HistoryPage from './pages/History';
import KitchenLayout from './kitchen/KitchenLayout';
import AdminLayout from './admin/AdminLayout';
import SuperAdminLayout from './superadmin/SuperAdminLayout';
import Login from './pages/Login';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') ||
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Customer-facing (mobile-first, max-width 480px) ── */}
        <Route path="/" element={
          <div className="app-container">
            <Menu theme={theme} toggleTheme={toggleTheme} />
          </div>
        } />
        <Route path="/checkout" element={
          <div className="app-container"><Checkout /></div>
        } />
        <Route path="/status/:orderId" element={
          <div className="app-container"><OrderStatusPage /></div>
        } />
        <Route path="/success" element={
          <div className="app-container"><PostPaymentSuccess /></div>
        } />
        <Route path="/history" element={
          <div className="app-container"><HistoryPage /></div>
        } />
        
        <Route path="/login" element={<Login />} />

        {/* ── Kitchen Display — full-screen dark, own CSS ── */}
        <Route path="/kitchen/*" element={<KitchenLayout />} />

        {/* ── Admin Portal — full-screen light/indigo, own CSS ── */}
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/superadmin/*" element={<SuperAdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
