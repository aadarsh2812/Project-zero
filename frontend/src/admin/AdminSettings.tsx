import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, CheckCircle2, Store, CreditCard, Image as ImageIcon, Key, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { getSettings, saveSettings, type AppSettings } from '../services/settingsService';

const DEFAULT_SETTINGS: AppSettings = {
  hotelName: '',
  hotelLogo: '',
  paymentFlow: 'BEFORE_EATING',
  currency: '₹',
  razorpayKeyId: '',
};

export default function AdminSettings() {
  const hotelId = localStorage.getItem('active_hotelId') || '';
  const [form, setForm] = useState<AppSettings>(DEFAULT_SETTINGS);
  // Razorpay secret is write-only — never returned from backend
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [showSecret, setShowSecret]         = useState(false);
  const [toast, setToast]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = async () => {
    if (!hotelId) return;
    const data = await getSettings(hotelId);
    setForm(data);
  };

  useEffect(() => { load(); }, [hotelId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSave = async () => {
    setError('');
    if (!form.hotelName.trim()) { setError('Hotel Name is required'); return; }
    if (!hotelId) { setError('No active hotel found. Please log in again.'); return; }

    setSaving(true);
    try {
      await saveSettings({ ...form, razorpayKeySecret: razorpaySecret }, hotelId);
      showToast('Settings saved successfully');
      setRazorpaySecret(''); // clear the secret field after save
      load();
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="a-page">
      <div className="a-section-header">
        <div>
          <p className="a-section-title">System Settings</p>
          <p className="a-section-sub">Configure branding, payments, and Razorpay integration</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: '0.875rem' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

        {/* ── Branding ── */}
        <div className="a-card">
          <div className="a-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Store size={18} className="a-stat-icon primary" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <p className="a-section-title" style={{ fontSize: '0.9rem' }}>Branding Setup</p>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-group">
              <label className="a-label">Hotel / Restaurant Name</label>
              <input
                className="a-input"
                placeholder="e.g. The Grand Kitchen"
                value={form.hotelName}
                onChange={e => setForm(f => ({ ...f, hotelName: e.target.value }))}
              />
            </div>

            <div className="a-form-group" style={{ marginBottom: 0 }}>
              <label className="a-label">Hotel Logo URL</label>
              <input
                className="a-input"
                placeholder="https://example.com/logo.png"
                value={form.hotelLogo}
                onChange={e => setForm(f => ({ ...f, hotelLogo: e.target.value }))}
              />
              <div style={{ marginTop: 12, padding: 12, background: 'var(--a-surface-2)', borderRadius: 'var(--a-radius-sm)', border: '1px solid var(--a-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                {form.hotelLogo ? (
                  <img src={form.hotelLogo} alt="Logo Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--a-border)' }} />
                ) : (
                  <div style={{ width: 60, height: 60, background: 'var(--a-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--a-text-dim)' }}><ImageIcon size={20} /></div>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--a-text-muted)' }}>Logo Preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment Flow ── */}
        <div className="a-card">
          <div className="a-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={18} className="a-stat-icon info" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <p className="a-section-title" style={{ fontSize: '0.9rem' }}>Payment Flow</p>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-group">
              <label className="a-label" style={{ marginBottom: 12 }}>When do customers pay?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, border: `1.5px solid ${form.paymentFlow === 'BEFORE_EATING' ? 'var(--a-primary)' : 'var(--a-border)'}`, borderRadius: 'var(--a-radius-sm)', cursor: 'pointer', background: form.paymentFlow === 'BEFORE_EATING' ? 'var(--a-primary-light)' : 'var(--a-surface)' }}>
                  <input type="radio" name="payFlow" style={{ marginTop: 2 }} checked={form.paymentFlow === 'BEFORE_EATING'} onChange={() => setForm(f => ({ ...f, paymentFlow: 'BEFORE_EATING' }))} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--a-text)', marginBottom: 3 }}>Pay Before Eating (QSR Mode)</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--a-text-muted)', lineHeight: 1.4 }}>Order goes to kitchen only after Razorpay payment is completed. Ideal for quick service restaurants.</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, border: `1.5px solid ${form.paymentFlow === 'AFTER_EATING' ? 'var(--a-primary)' : 'var(--a-border)'}`, borderRadius: 'var(--a-radius-sm)', cursor: 'pointer', background: form.paymentFlow === 'AFTER_EATING' ? 'var(--a-primary-light)' : 'var(--a-surface)' }}>
                  <input type="radio" name="payFlow" style={{ marginTop: 2 }} checked={form.paymentFlow === 'AFTER_EATING'} onChange={() => setForm(f => ({ ...f, paymentFlow: 'AFTER_EATING' }))} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--a-text)', marginBottom: 3 }}>Pay After Eating (Dine-In Mode)</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--a-text-muted)', lineHeight: 1.4 }}>Order goes to kitchen immediately. Customer pays at the end via Razorpay or cash.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="a-form-group" style={{ marginBottom: 0 }}>
              <label className="a-label">Currency Symbol</label>
              <input
                className="a-input"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                style={{ width: '100px', textAlign: 'center', fontSize: '1.2rem' }}
              />
            </div>
          </div>
        </div>

        {/* ── Razorpay Integration ── */}
        <div className="a-card" style={{ gridColumn: '1 / -1' }}>
          <div className="a-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Key size={18} className="a-stat-icon warning" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <div>
                <p className="a-section-title" style={{ fontSize: '0.9rem' }}>Razorpay Integration</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)', marginTop: 2 }}>Used for online payments on the customer ordering page</p>
              </div>
            </div>
          </div>
          <div className="a-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="a-form-group" style={{ marginBottom: 0 }}>
              <label className="a-label">Razorpay Key ID <span style={{ color: 'var(--a-text-muted)', fontWeight: 400 }}>(Public)</span></label>
              <input
                className="a-input"
                placeholder="rzp_live_XXXXXXXXXXXX or rzp_test_XXXXXXXXXXXX"
                value={form.razorpayKeyId}
                onChange={e => setForm(f => ({ ...f, razorpayKeyId: e.target.value }))}
                autoComplete="off"
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--a-text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                This key is sent to the customer browser to open the Razorpay checkout. Safe to expose.
              </p>
            </div>

            <div className="a-form-group" style={{ marginBottom: 0 }}>
              <label className="a-label">Razorpay Key Secret <span style={{ color: 'var(--a-text-muted)', fontWeight: 400 }}>(Private)</span></label>
              <div className="a-input-wrap">
                <input
                  className="a-input"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Leave blank to keep existing secret"
                  value={razorpaySecret}
                  onChange={e => setRazorpaySecret(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--a-text-dim)', display: 'flex' }}
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--a-text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                Stored securely on the server. Never returned to the browser. Leave blank to keep the current value.
              </p>
            </div>

            <div style={{ gridColumn: '1 / -1', padding: '12px 16px', background: 'var(--a-primary-light)', borderRadius: 8, border: '1px solid rgba(79,70,229,0.2)', fontSize: '0.8rem', color: 'var(--a-text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--a-text)' }}>How to get your Razorpay keys:</strong><br />
              1. Log in to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" style={{ color: 'var(--a-primary)' }}>dashboard.razorpay.com</a><br />
              2. Go to <strong>Settings → API Keys</strong><br />
              3. Generate a key pair — copy the Key ID (starts with <code>rzp_</code>) and Key Secret
            </div>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className="a-toast-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="a-toast"><CheckCircle2 size={15} style={{ color: 'var(--a-success)' }} />{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
