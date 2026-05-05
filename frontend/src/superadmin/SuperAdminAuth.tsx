import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SuperAdminApp.css';

import api from '../services/api';

export default function SuperAdminAuth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, role } = response.data;

      if (role !== 'SUPERADMIN') {
        setError('Access denied: Unauthorized role.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      sessionStorage.setItem('superadmin_auth', 'true');
      navigate('/superadmin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid system credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: '#0f172a', padding: '40px', borderRadius: '16px', border: '1px solid #1e293b', width: '360px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldAlert size={32} />
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: '1.4rem', margin: '0 0 6px' }}>Systems Console</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Super Administrator Access</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>USERNAME</label>
            <input 
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: '#f8fafc', outline: 'none' }}
              placeholder="sysadmin"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>PASSWORD</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: '#f8fafc', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}

          <button type="submit" className="sa-btn sa-btn-primary" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
            Authenticate Phase <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
