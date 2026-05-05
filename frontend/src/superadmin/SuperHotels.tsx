import { useState, useEffect } from 'react';
import { Plus, Pause, Play, Trash2 } from 'lucide-react';
import { getHotels, addHotel, updateHotelStatus, deleteHotel, updateHotelCreds, updateHotelContacts, subscribeToSuperAdmin, type HotelTenant, type HotelStatus } from '../services/superAdminService';
import { Shield, X, Users, Phone } from 'lucide-react';

export default function SuperHotels() {
  const [hotels, setHotels] = useState<HotelTenant[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Starter');
  const [editingCreds, setEditingCreds] = useState<HotelTenant | null>(null);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [kitchenUser, setKitchenUser] = useState('');
  const [kitchenPass, setKitchenPass] = useState('');

  const [managingContacts, setManagingContacts] = useState<HotelTenant | null>(null);
  const [cName, setCName] = useState('');
  const [cRole, setCRole] = useState('Owner');
  const [cPhone, setCPhone] = useState('');

  const fetchHotels = async () => {
    const data = await getHotels();
    setHotels(data);
  };

  useEffect(() => {
    fetchHotels();
    return subscribeToSuperAdmin(fetchHotels);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addHotel(newName.trim(), newPlan);
      setNewName('');
      setShowAdd(false);
      fetchHotels();
    } catch (error: any) {
      alert(error.message || 'Failed to add hotel');
    }
  };

  const toggleStatus = (id: string, current: HotelStatus) => {
    updateHotelStatus(id, current === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely remove ${name}? This action is irreversible.`)) {
      deleteHotel(id);
    }
  };

  const openCreds = (h: HotelTenant) => {
    setEditingCreds(h);
    setAdminUser(h.adminCreds?.user || '');
    setAdminPass(h.adminCreds?.pass || '');
    setKitchenUser(h.kitchenCreds?.user || '');
    setKitchenPass(h.kitchenCreds?.pass || '');
  };

  const saveCreds = async () => {
    if (editingCreds) {
      try {
        await updateHotelCreds(editingCreds.id, 'admin', adminUser, adminPass);
        await updateHotelCreds(editingCreds.id, 'kitchen', kitchenUser, kitchenPass);
        setEditingCreds(null);
        fetchHotels();
      } catch (error: any) {
        alert(error.message || 'Failed to update credentials.');
      }
    }
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (managingContacts && cName && cPhone) {
      const oldContacts = managingContacts.contacts || [];
      const updatedContacts = [...oldContacts, { id: Math.random().toString(36).substr(2,9), name: cName, role: cRole, phone: cPhone }];
      updateHotelContacts(managingContacts.id, updatedContacts);
      setCName(''); setCPhone('');
    }
  };

  const removeContact = (contactId: string) => {
    if (managingContacts) {
      const oldContacts = managingContacts.contacts || [];
      const updated = oldContacts.filter(c => c.id !== contactId);
      updateHotelContacts(managingContacts.id, updated);
    }
  };

  return (
    <div className="sa-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Hotel Operations</h2>
        <button className="sa-btn sa-btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Add Hotel
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', border: '1px solid #334155' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Hotel Name</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Plan</label>
            <select value={newPlan} onChange={e => setNewPlan(e.target.value as any)} style={{ padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', width: '150px' }}>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <button type="submit" className="sa-btn sa-btn-primary">Provision</button>
        </form>
      )}

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Access</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 700, opacity: 0.7 }}>{h.id}</td>
                <td style={{ fontWeight: 600 }}>{h.name}</td>
                <td><span className={`sa-pill ${h.status.toLowerCase()}`}>{h.status}</span></td>
                <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="sa-btn sa-btn-outline sa-btn-sm" onClick={() => openCreds(h)} style={{ gap: 4 }}>
                      <Shield size={13} /> Keys
                    </button>
                    <button className="sa-btn sa-btn-outline sa-btn-sm" onClick={() => setManagingContacts(h)} style={{ gap: 4, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: '#0ea5e9' }}>
                      <Users size={13} /> CRM
                    </button>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="sa-btn sa-btn-outline sa-btn-sm" onClick={() => toggleStatus(h.id, h.status)}>
                      {h.status === 'ACTIVE' ? <><Pause size={14} /> Pause Access</> : <><Play size={14} /> Resume</>}
                    </button>
                    <button className="sa-btn sa-btn-danger sa-btn-sm" onClick={() => handleDelete(h.id, h.name)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>No hotels onboarded.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingCreds && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Access Control</h3>
              <button onClick={() => setEditingCreds(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#a855f7', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>Hotel Admin App</h4>
              <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} placeholder="Username" style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', marginBottom: '8px' }} />
              <input type="text" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#a855f7', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>Kitchen Display App</h4>
              <input type="text" value={kitchenUser} onChange={e => setKitchenUser(e.target.value)} placeholder="Username" style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', marginBottom: '8px' }} />
              <input type="text" value={kitchenPass} onChange={e => setKitchenPass(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc' }} />
            </div>

            <button className="sa-btn sa-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveCreds}>
              Update Credentials
            </button>
          </div>
        </div>
      )}

      {managingContacts && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '500px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{managingContacts.name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Contact Directory</p>
              </div>
              <button onClick={() => setManagingContacts(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={addContact} style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'flex-end', background: '#0f172a', padding: 12, borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Name</label>
                <input type="text" value={cName} onChange={e => setCName(e.target.value)} style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }} required />
              </div>
              <div style={{ width: '90px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Role</label>
                <select value={cRole} onChange={e => setCRole(e.target.value)} style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}>
                  <option>Owner</option>
                  <option>Manager</option>
                  <option>Technical</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Phone No.</label>
                <input type="text" value={cPhone} onChange={e => setCPhone(e.target.value)} style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }} required />
              </div>
              <button type="submit" className="sa-btn sa-btn-primary" style={{ padding: '6px 12px', height: '31px' }}>Add</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!(managingContacts.contacts && managingContacts.contacts.length > 0) ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', margin: '20px 0' }}>No contacts found.</p>
              ) : (
                managingContacts.contacts.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem' }}>{c.name}</h4>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>{c.role}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {c.phone}</div>
                    </div>
                    <button onClick={() => removeContact(c.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
