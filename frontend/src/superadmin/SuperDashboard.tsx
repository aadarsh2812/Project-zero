import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Activity, CreditCard, AlertCircle } from 'lucide-react';
import { getHotels, subscribeToSuperAdmin, type HotelTenant } from '../services/superAdminService';

export default function SuperDashboard() {
  const [hotels, setHotels] = useState<HotelTenant[]>([]);

  const fetchHotels = async () => {
    const data = await getHotels();
    setHotels(data);
  };

  useEffect(() => {
    fetchHotels();
    return subscribeToSuperAdmin(fetchHotels);
  }, []);

  const totalHotels = hotels.length;
  const activeHotels = hotels.filter(h => h.status === 'ACTIVE').length;
  const dues = hotels.filter(h => h.paymentDue).length;
  const paused = hotels.filter(h => h.status === 'PAUSED').length;

  const mrr = activeHotels === 0 ? 0 : hotels.filter(h => h.status === 'ACTIVE').reduce((sum, h) => {
    return sum + (h.plan === 'Starter' ? 999 : h.plan === 'Pro' ? 2499 : 4999);
  }, 0);

  const cards = [
    { label: 'Total Clients', value: totalHotels.toString(), icon: Building2, cls: 'primary' },
    { label: 'Active Hotels', value: activeHotels.toString(), icon: Activity, cls: 'success' },
    { label: 'Monthly Rev.', value: `₹${mrr.toLocaleString('en-IN')}`, icon: CreditCard, cls: 'danger' },
    { label: 'Payments Due', value: dues.toString(), icon: AlertCircle, cls: 'warning' },
  ];

  return (
    <div className="sa-page">
      <div className="sa-grid">
        {cards.map((c, i) => (
          <motion.div 
            key={c.label} 
            className={`sa-card ${c.cls}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="sa-card-icon"><c.icon size={22} /></div>
            <div className="sa-card-info">
              <h3>{c.value}</h3>
              <p>{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Hotel ID</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Status</th>
              <th>SaaS Dues</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 700, opacity: 0.7 }}>{h.id}</td>
                <td style={{ fontWeight: 600 }}>{h.name}</td>
                <td>{h.plan}</td>
                <td>
                  <span className={`sa-pill ${h.status.toLowerCase()}`}>{h.status}</span>
                </td>
                <td>
                  {h.paymentDue ? <span className="sa-pill due">Payment Pending</span> : <span className="sa-pill active">Paid Up</span>}
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>No hotels onboarded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
