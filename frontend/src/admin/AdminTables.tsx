import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Check, X, Printer, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getSettings } from '../services/settingsService';
import { getTables, saveTable, deleteTable, type Table } from '../services/tableService';

type TableStatus = 'available' | 'occupied' | 'reserved';

const STATUS_STYLE: Record<TableStatus, { pill: string; card: string; label: string }> = {
  available: { pill: 'active',   card: '',         label: 'Available' },
  occupied:  { pill: 'preparing', card: 'occupied', label: 'Occupied' },
  reserved:  { pill: 'ordered',   card: 'reserved', label: 'Reserved' },
};

const BLANK_TABLE: Omit<Table, 'id'> = { number: 0, capacity: 4, status: 'available', floor: 'Ground Floor' };

export default function AdminTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [modal, setModal]   = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Table | null>(null);
  const [form, setForm]     = useState<Omit<Table, 'id'>>(BLANK_TABLE);
  const [toast, setToast]   = useState('');
  const [settings, setSettings] = useState<any>({ hotelName: 'The Grand Kitchen' });

  const hotelId = localStorage.getItem('active_hotelId') || '';
  
  const fetchData = async () => {
    const [tableData, settingsData] = await Promise.all([
      getTables(hotelId),
      getSettings(hotelId)
    ]);
    setTables(tableData);
    setSettings(settingsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const floors    = [...new Set(tables.map(t => t.floor))];

  const cycleStatus = async (table: Table) => {
    const cycle: TableStatus[] = ['available', 'occupied', 'reserved'];
    const idx = cycle.indexOf(table.status);
    const nextStatus = cycle[(idx + 1) % cycle.length];
    await saveTable({ ...table, status: nextStatus }, hotelId);
    fetchData();
    showToast(`Table updated`);
  };

  const openAdd = () => { setForm(BLANK_TABLE); setEditTarget(null); setModal('add'); };
  const openEdit = (t: Table) => { setEditTarget(t); setForm({ ...t }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditTarget(null); };

  const handleSave = async () => {
    if (!form.number || form.capacity < 1) { alert('Table number and capacity required.'); return; }
    const newTable: Table = modal === 'add' 
      ? { ...form, id: `t${Date.now()}` } 
      : { ...form, id: editTarget!.id };
      
    await saveTable(newTable, hotelId);
    showToast(`Table ${form.number} ${modal === 'add' ? 'added' : 'updated'}`);
    fetchData();
    closeModal();
  };

  const handleDelete = async (t: Table) => {
    if (!confirm(`Remove Table ${t.number}?`)) return;
    await deleteTable(t.id);
    fetchData();
    showToast(`Table ${t.number} removed`);
  };

  const summary = {
    available: tables.filter(t => t.status === 'available').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="a-page">
      {/* Header */}
      <div className="a-section-header no-print">
        <div>
          <p className="a-section-title">Table Management</p>
          <p className="a-section-sub">{tables.length} tables · Click a table to cycle its status</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="a-btn a-btn-outline" onClick={() => window.print()}>
            <Printer size={15} /> Print QRs
          </button>
          <button className="a-btn a-btn-primary" onClick={openAdd}><Plus size={15} /> Add Table</button>
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 10 }} className="no-print">
        <span className="a-pill active"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--a-success)', display: 'inline-block' }} /> {summary.available} Available</span>
        <span className="a-pill preparing"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--a-primary)', display: 'inline-block' }} /> {summary.occupied} Occupied</span>
        <span className="a-pill ordered"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--a-warning)', display: 'inline-block' }} /> {summary.reserved} Reserved</span>
      </div>

      {/* Tables by floor */}
      {floors.map(floor => (
        <div key={floor} className="no-print">
          <p className="a-section-title" style={{ marginBottom: 10 }}>{floor}</p>
          <div className="a-tables-grid">
            <AnimatePresence mode="popLayout">
              {tables.filter(t => t.floor === floor).map((t, i) => (
                <motion.div
                  key={t.id}
                  className={`a-table-card ${t.status}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => cycleStatus(t)}
                  title="Click to cycle status"
                >
                  <div className="a-table-num">{t.number}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 4px' }}>
                    <span className={`a-pill ${STATUS_STYLE[t.status].pill}`} style={{ fontSize: '0.68rem' }}>
                      {STATUS_STYLE[t.status].label}
                    </span>
                  </div>
                  <div className="a-table-cap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Users size={11} />{t.capacity} seats
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <button className="a-btn a-btn-ghost a-btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(t)}><Pencil size={12} /></button>
                    <button className="a-btn a-btn-danger a-btn-icon" style={{ width: 28, height: 28 }} onClick={() => handleDelete(t)}><Trash2 size={12} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div className="a-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <motion.div className="a-modal" style={{ maxWidth: 380 }} initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}>
              <div className="a-modal-header">
                <span className="a-modal-title">{modal === 'add' ? 'Add Table' : `Edit Table ${editTarget?.number}`}</span>
                <button className="a-btn a-btn-ghost a-btn-icon" onClick={closeModal}><X size={15} /></button>
              </div>
              <div className="a-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="a-form-group">
                    <label className="a-label">Table No.</label>
                    <input type="number" className="a-input" min={1} value={form.number || ''} onChange={e => setForm(f => ({ ...f, number: +e.target.value }))} />
                  </div>
                  <div className="a-form-group">
                    <label className="a-label">Capacity</label>
                    <input type="number" className="a-input" min={1} value={form.capacity || ''} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
                  </div>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Floor / Zone</label>
                  <input className="a-input" placeholder="e.g. Ground Floor" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
                </div>
                <div className="a-form-group">
                  <label className="a-label">Status</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['available', 'occupied', 'reserved'] as TableStatus[]).map(s => (
                      <button key={s} type="button" className={`a-btn a-btn-sm ${form.status === s ? 'a-btn-primary' : 'a-btn-outline'}`}
                        onClick={() => setForm(f => ({ ...f, status: s }))}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="a-modal-footer">
                <button className="a-btn a-btn-outline" onClick={closeModal}>Cancel</button>
                <button className="a-btn a-btn-primary" onClick={handleSave}>
                  <Check size={14} />{modal === 'add' ? 'Add Table' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="a-toast-wrap no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="a-toast"><Check size={14} style={{ color: 'var(--a-success)' }} />{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print-only QR Codes */}
      <div className="print-only">
        <style>{`
          @media print {
            .no-print, .a-sidebar, .a-topbar { display: none !important; }
            .a-main { margin-left: 0 !important; }
            .a-page { padding: 0 !important; }
            .print-only { display: flex !important; flex-wrap: wrap; gap: 40px; justify-content: center; }
            .qr-card { 
              border: 2px solid #000; padding: 20px; text-align: center; 
              width: 250px; height: 250px; page-break-inside: avoid;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
            }
          }
          .print-only { display: none; }
        `}</style>
        {tables.map(t => (
          <div key={t.id} className="qr-card">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px', textTransform: 'uppercase' }}>
              {settings.hotelName}
            </h2>
            <QRCodeSVG 
              value={`${window.location.origin}/?table=${t.number}&hotel=${hotelId}`} 
              size={120} 
              level="H" 
              includeMargin={false}
            />
            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '10px 0 0' }}>Table {t.number}</p>
            <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0' }}>Scan to order</p>
          </div>
        ))}
      </div>
    </div>
  );
}
