import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Check, ImageIcon, RefreshCw } from 'lucide-react';
import { getCategories, getMenuItems, saveMenuItem, deleteMenuItem, type MenuItem, type Category } from '../services/menuService';

const BLANK: Omit<MenuItem, 'id'> = {
  categoryId: 'cat-1', name: '', description: '', price: 0,
  type: 'veg', image: '', available: true,
};

export default function AdminMenu() {
  const hotelId = localStorage.getItem('active_hotelId') || '';
  const [items, setItems]       = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'veg' | 'non-veg'>('ALL');
  const [modal, setModal]       = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing]   = useState<MenuItem | null>(null);
  const [form, setForm]         = useState<Omit<MenuItem, 'id'>>(BLANK);
  const [toast, setToast]       = useState('');
  const [loading, setLoading]   = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [catData, itemData] = await Promise.all([
      getCategories(hotelId),
      getMenuItems(hotelId)
    ]);
    setCategories(catData);
    setItems(itemData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = items
    .filter(i => catFilter === 'ALL' || i.categoryId === catFilter)
    .filter(i => typeFilter === 'ALL' || i.type === typeFilter)
    .filter(i =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    );

  const openAdd = () => { setForm(BLANK); setEditing(null); setModal('add'); };
  const openEdit = (item: MenuItem) => { setEditing(item); setForm({ ...item }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) { alert('Name and price are required.'); return; }
    
    const newItem: MenuItem = modal === 'add' 
      ? { ...form, id: `m${Date.now()}` } 
      : { ...form, id: editing!.id };
      
    await saveMenuItem(newItem, hotelId);
    showToast(`"${form.name}" ${modal === 'add' ? 'added' : 'updated'}`);
    fetchData();
    closeModal();
  };

  const toggleAvail = async (item: MenuItem) => {
    const updated = { ...item, available: !item.available };
    await saveMenuItem(updated, hotelId);
    fetchData();
    showToast(updated.available ? 'Item enabled' : 'Item disabled');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from menu?`)) return;
    await deleteMenuItem(id);
    fetchData();
    showToast(`"${name}" removed`);
  };

  return (
    <div className="a-page">
      {/* Header */}
      <div className="a-section-header">
        <div>
          <p className="a-section-title">Menu Management</p>
          <p className="a-section-sub">{items.length} items · {items.filter(i => i.available).length} available</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd} id="a-add-item-btn">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="a-filter-bar">
        <div className="a-search-wrap">
          <Search size={15} className="a-search-icon" />
          <input className="a-search-input" placeholder="Search menu items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="a-input a-select" style={{ width: 'auto', padding: '9px 36px 9px 14px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="ALL">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(['ALL', 'veg', 'non-veg'] as const).map(t => (
          <button key={t} className={`a-btn a-btn-sm ${typeFilter === t ? 'a-btn-primary' : 'a-btn-outline'}`} onClick={() => setTypeFilter(t)}>
            {t === 'ALL' ? 'All' : t === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="a-empty">
          <ImageIcon size={36} />
          <h3>No items found</h3>
          <p>Try a different filter or add a new item.</p>
        </div>
      ) : (
        <div className="a-menu-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                className="a-menu-card"
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                style={{ opacity: item.available ? 1 : 0.5 }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=140&fit=crop'} alt={item.name} className="a-menu-card-img" />
                  <span className={`a-pill ${item.type === 'veg' ? 'veg' : 'nonveg'}`} style={{ position: 'absolute', top: 8, left: 8 }}>
                    {item.type === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                  </span>
                  <span className={`a-pill ${item.available ? 'active' : 'inactive'}`} style={{ position: 'absolute', top: 8, right: 8 }}>
                    {item.available ? 'Available' : 'Off Menu'}
                  </span>
                </div>
                <div className="a-menu-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p className="a-menu-card-name">{item.name}</p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--a-text-dim)' }}>
                      {categories.find(c => c.id === item.categoryId)?.name}
                    </span>
                  </div>
                  <p className="a-menu-card-desc">{item.description}</p>
                </div>
                <div className="a-menu-card-footer">
                  <span className="a-menu-price">₹{item.price}</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className={`a-btn a-btn-sm ${item.available ? 'a-btn-outline' : 'a-btn-success'}`} onClick={() => toggleAvail(item)}>
                      {item.available ? 'Disable' : 'Enable'}
                    </button>
                    <button className="a-btn a-btn-ghost a-btn-icon a-btn-sm" onClick={() => openEdit(item)}><Pencil size={13} /></button>
                    <button className="a-btn a-btn-danger a-btn-icon a-btn-sm" onClick={() => handleDelete(item.id, item.name)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div className="a-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <motion.div className="a-modal" initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} transition={{ duration: 0.22 }}>
              <div className="a-modal-header">
                <span className="a-modal-title">{modal === 'add' ? 'Add Menu Item' : 'Edit Item'}</span>
                <button className="a-btn a-btn-ghost a-btn-icon" onClick={closeModal}><X size={15} /></button>
              </div>
              <div className="a-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Name */}
                <div className="a-form-group">
                  <label className="a-label">Item Name *</label>
                  <input className="a-input" placeholder="e.g. Butter Chicken" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                {/* Desc */}
                <div className="a-form-group">
                  <label className="a-label">Description</label>
                  <input className="a-input" placeholder="Short description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                {/* Price + Category in row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="a-form-group">
                    <label className="a-label">Price (₹) *</label>
                    <input type="number" min={1} className="a-input" placeholder="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
                  </div>
                  <div className="a-form-group">
                    <label className="a-label">Category</label>
                    <select className="a-input a-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                {/* Type */}
                <div className="a-form-group">
                  <label className="a-label">Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['veg', 'non-veg'] as const).map(t => (
                      <button key={t} type="button" className={`a-btn a-btn-sm ${form.type === t ? 'a-btn-primary' : 'a-btn-outline'}`} onClick={() => setForm(f => ({ ...f, type: t }))}>
                        {t === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Image URL */}
                <div className="a-form-group">
                  <label className="a-label">Image URL</label>
                  <input className="a-input" placeholder="https://…" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
                  {form.image && <img src={form.image} alt="preview" style={{ marginTop: 8, width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--a-border)' }} />}
                </div>
                {/* Available toggle */}
                <div className="a-form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="a-label" style={{ margin: 0 }}>Available on Menu</label>
                  <button type="button" className={`a-btn a-btn-sm ${form.available ? 'a-btn-success' : 'a-btn-outline'}`} onClick={() => setForm(f => ({ ...f, available: !f.available }))}>
                    {form.available ? <><Check size={13} /> Yes</> : 'No'}
                  </button>
                </div>
              </div>
              <div className="a-modal-footer">
                <button className="a-btn a-btn-outline" onClick={closeModal}>Cancel</button>
                <button className="a-btn a-btn-primary" onClick={handleSave}>
                  {modal === 'add' ? <><Plus size={14} />Add Item</> : <><Check size={14} />Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="a-toast-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="a-toast"><Check size={15} style={{ color: 'var(--a-success)' }} />{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
