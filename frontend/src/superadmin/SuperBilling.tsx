import { useState, useEffect } from 'react';
import { Bell, BellOff, DollarSign } from 'lucide-react';
import { getHotels, updatePaymentDue, subscribeToSuperAdmin, type HotelTenant } from '../services/superAdminService';

export default function SuperBilling() {
  const [hotels, setHotels] = useState<HotelTenant[]>([]);

  const fetchHotels = async () => {
    const data = await getHotels();
    setHotels(data);
  };

  useEffect(() => {
    fetchHotels();
    return subscribeToSuperAdmin(fetchHotels);
  }, []);

  const togglePaymentDue = (id: string, currentlyDue: boolean) => {
    updatePaymentDue(id, !currentlyDue);
  };

  return (
    <div className="sa-page">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Billing & Subscriptions</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>Manage platform fees and issue payment alerts to hotel admins.</p>
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Hotel Name</th>
              <th>Current Plan</th>
              <th>Est. Monthly Fee</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map(h => {
              const fee = h.plan === 'Starter' ? '₹999' : h.plan === 'Pro' ? '₹2,499' : '₹4,999';
              return (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.name}</td>
                  <td>{h.plan}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}><DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 2 }}/>{fee}</td>
                  <td>
                    {h.paymentDue 
                      ? <span className="sa-pill due">Payment Overdue</span> 
                      : <span className="sa-pill active">In Good Standing</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className={`sa-btn sa-btn-sm ${h.paymentDue ? 'sa-btn-outline' : 'sa-btn-danger'}`}
                      onClick={() => togglePaymentDue(h.id, h.paymentDue)}
                    >
                      {h.paymentDue ? <><BellOff size={14} /> Clear Alert</> : <><Bell size={14} /> Send "Due" Notice</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
