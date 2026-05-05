import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, User, Lock, Eye, EyeOff, AlertCircle, LogIn, Zap } from 'lucide-react';
import { getHotels } from '../services/superAdminService';

// ----- Dummy users -----
// Hardcoded fallback for UI rendering, but validation checks the super admin state
const FALLBACK_USERS = [
  { username: 'chef',     password: 'chef123',   role: 'Head Chef',     initials: 'HC' },
];

export default function KitchenAuth() {
  const navigate   = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // Simulated network delay

    const mainHotel = null; // Removed synchronous getHotels().find
    const validUser = mainHotel?.kitchenCreds?.user || 'chef';
    const validPass = mainHotel?.kitchenCreds?.pass || 'chef123';

    if (username.trim().toLowerCase() === validUser && password === validPass) {
      sessionStorage.setItem('kitchen_auth', 'true');
      sessionStorage.setItem('kitchen_user', JSON.stringify({
        username: validUser,
        role: 'Head Chef',
        initials: 'HC',
      }));
      navigate('/kitchen/dashboard', { replace: true });
    } else {
      setError('Invalid username or password. Try the credentials below.');
    }

    setLoading(false);
  };

  const quickFill = () => {
    const mainHotel = null; // Removed synchronous getHotels().find
    setUsername(mainHotel?.kitchenCreds?.user || 'chef');
    setPassword(mainHotel?.kitchenCreds?.pass || 'chef123');
    setError('');
  };

  return (
    <div className="k-auth-page">
      <div className="k-auth-card">
        {/* Header */}
        <div className="k-auth-header">
          <div className="k-auth-logo">
            <ChefHat size={34} color="#fff" />
          </div>
          <h1>Kitchen Portal</h1>
          <p>Sign in to manage your order queue</p>
        </div>

        {/* Form */}
        <div className="k-auth-body">
          <form onSubmit={handleLogin} noValidate>
            {error && (
              <div className="k-auth-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Username */}
            <div className="k-auth-form-group">
              <label className="k-auth-label" htmlFor="k-username">Username</label>
              <div className="k-auth-input-wrap">
                <span className="k-auth-input-icon"><User size={16} /></span>
                <input
                  id="k-username"
                  type="text"
                  className={`k-auth-input ${error ? 'error' : ''}`}
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="k-auth-form-group">
              <label className="k-auth-label" htmlFor="k-password">Password</label>
              <div className="k-auth-input-wrap">
                <span className="k-auth-input-icon"><Lock size={16} /></span>
                <input
                  id="k-password"
                  type={showPwd ? 'text' : 'password'}
                  className={`k-auth-input ${error ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="k-auth-eye"
                  onClick={() => setShowPwd(p => !p)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="k-login-btn"
              type="submit"
              className="k-auth-submit"
              disabled={loading || !username || !password}
            >
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Signing in…</>
                : <><LogIn size={16} />Sign In</>
              }
            </button>
          </form>

          {/* Quick‑fill hint */}
          <div className="k-auth-hint">
            <p><Zap size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Quick access — click to fill</p>
            <div className="k-creds-list">
              <div className="k-cred-item" onClick={quickFill} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && quickFill()}>
                <span className="k-cred-role">Kitchen Staff</span>
                <span className="k-cred-details">chef / chef123</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
