import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Lock, Eye, EyeOff, AlertCircle, LogIn, Zap } from 'lucide-react';
import { getHotels } from '../services/superAdminService';
import api from '../services/api';
import '../admin/AdminApp.css';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, role, hotelId } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (hotelId) localStorage.setItem('active_hotelId', hotelId);
      sessionStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_user', JSON.stringify({
        username: username,
        role: role === 'ADMIN' ? 'Hotel Admin' : role,
        initials: username.substring(0, 2).toUpperCase(),
        access: 'all',
      }));
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = () => {
    const mainHotel = null; // Removed synchronous getHotels().find
    setUsername(mainHotel?.adminCreds?.user || 'admin');
    setPassword(mainHotel?.adminCreds?.pass || 'admin123');
    setError('');
  };

  return (
    <div className="a-auth-page admin-root">
      <div className="a-auth-card">
        <div className="a-auth-header">
          <div className="a-auth-logo">
            <LayoutDashboard size={30} color="#fff" />
          </div>
          <h1>Admin Portal</h1>
          <p>The Grand Kitchen · Management Console</p>
        </div>

        <div className="a-auth-body">
          <form onSubmit={handleLogin} noValidate>
            {error && (
              <div className="a-auth-error">
                <AlertCircle size={15} />{error}
              </div>
            )}

            <div className="a-form-group">
              <label className="a-label" htmlFor="a-username">Username</label>
              <div className="a-input-wrap">
                <span className="a-input-icon"><User size={15} /></span>
                <input
                  id="a-username"
                  type="text"
                  className="a-input with-icon"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="a-form-group">
              <label className="a-label" htmlFor="a-password">Password</label>
              <div className="a-input-wrap">
                <span className="a-input-icon"><Lock size={15} /></span>
                <input
                  id="a-password"
                  type={showPwd ? 'text' : 'password'}
                  className="a-input with-icon"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-text-dim)', display: 'flex' }}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="a-login-btn"
              type="submit"
              className="a-auth-submit"
              disabled={loading || !username || !password}
            >
              {loading
                ? <><span className="a-spinner" />Signing in…</>
                : <><LogIn size={15} />Sign In</>
              }
            </button>
          </form>

          <div className="a-auth-hint">
            <p><Zap size={10} style={{ display: 'inline', marginRight: 3 }} />Click to quick fill</p>
            <div className="a-creds-list">
              <div
                className="a-cred-item"
                onClick={quickFill}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && quickFill()}
              >
                <span className="a-cred-role">Initial Admin</span>
                <span className="a-cred-detail">admin / admin123</span>
              </div>
              <div
                className="a-cred-item"
                style={{ marginTop: 8 }}
                onClick={() => { setUsername('chef'); setPassword('chef123'); }}
                role="button"
                tabIndex={0}
              >
                <span className="a-cred-role">Initial Kitchen</span>
                <span className="a-cred-detail">chef / chef123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
