export type HotelStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE';

export interface HotelTenant {
  id: string;
  name: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: HotelStatus;
  paymentDue: boolean;
  createdAt: number;
  adminCreds?: { user: string; pass: string };
  kitchenCreds?: { user: string; pass: string };
  contacts: { id: string; name: string; role: string; phone: string }[];
}

import api from './api';

export async function getHotels(): Promise<HotelTenant[]> {
  try {
    const response = await api.get('/hotels');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch hotels:', error);
    return [];
  }
}

export function saveHotels(hotels: HotelTenant[]) {
  // Logic shifted to individual add/update methods
  window.dispatchEvent(new Event('super_admin_updated'));
}

export function subscribeToSuperAdmin(callback: () => void) {
  const handleUpdate = () => callback();
  window.addEventListener('super_admin_updated', handleUpdate);
  return () => {
    window.removeEventListener('super_admin_updated', handleUpdate);
  };
}

export async function addHotel(name: string, plan: 'Starter' | 'Pro' | 'Enterprise') {
  try {
    await api.post('/hotels', { name, plan, status: 'ACTIVE' });
    window.dispatchEvent(new Event('super_admin_updated'));
  } catch (error) {
    console.error('Failed to add hotel:', error);
    throw error;
  }
}

export async function updateHotelStatus(id: string, status: HotelStatus) {
  try {
    await api.patch(`/hotels/${id}/status`, status);
    window.dispatchEvent(new Event('super_admin_updated'));
  } catch (error) {
    console.error('Failed to update hotel status:', error);
  }
}

export async function updatePaymentDue(id: string, isDue: boolean) {
  // Not yet implemented in backend, would be a patch to hotel
}

export async function deleteHotel(id: string) {
  try {
    await api.delete(`/hotels/${id}`);
    window.dispatchEvent(new Event('super_admin_updated'));
  } catch (error) {
    console.error('Failed to delete hotel:', error);
  }
}

export async function updateHotelCreds(id: string, type: 'admin' | 'kitchen', user: string, pass: string) {
  try {
    await api.put(`/hotels/${id}/credentials?type=${type}`, { user, pass });
    window.dispatchEvent(new Event('super_admin_updated'));
  } catch (error: any) {
    console.error('Failed to update hotel credentials:', error);
    if (error.response?.status === 409) {
        throw new Error('Username already taken. Please choose a different username.');
    }
    throw new Error('Failed to update credentials. Check console for details.');
  }
}

export function updateHotelContacts(id: string, contacts: { id: string; name: string; role: string; phone: string }[]) {
  // This would need a contact entity in backend
}
