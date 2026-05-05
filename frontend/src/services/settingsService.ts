import api from './api';

export type PaymentFlow = 'BEFORE_EATING' | 'AFTER_EATING';

export interface AppSettings {
  hotelName: string;
  hotelLogo: string;
  paymentFlow: PaymentFlow;
  currency: string;
  razorpayKeyId: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  hotelName: 'Restaurant',
  hotelLogo: '',
  paymentFlow: 'BEFORE_EATING',
  currency: '₹',
  razorpayKeyId: '',
};

export const getSettings = async (hotelId: string): Promise<AppSettings> => {
  try {
    const response = await api.get(`/hotels/${hotelId}`);
    const hotel = response.data;
    if (!hotel) return DEFAULT_SETTINGS;

    return {
      hotelName: hotel.name || DEFAULT_SETTINGS.hotelName,
      hotelLogo: hotel.logo || DEFAULT_SETTINGS.hotelLogo,
      paymentFlow: (hotel.paymentFlow as PaymentFlow) || DEFAULT_SETTINGS.paymentFlow,
      currency: hotel.currency || DEFAULT_SETTINGS.currency,
      razorpayKeyId: hotel.razorpayKeyId || '',
    };
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (
  settings: AppSettings & { razorpayKeySecret?: string },
  hotelId: string
): Promise<void> => {
  try {
    await api.put(`/hotels/${hotelId}`, {
      name: settings.hotelName,
      logo: settings.hotelLogo,
      paymentFlow: settings.paymentFlow,
      currency: settings.currency,
      razorpayKeyId: settings.razorpayKeyId,
      // Only send secret if the user actually typed one (non-empty)
      ...(settings.razorpayKeySecret ? { razorpayKeySecret: settings.razorpayKeySecret } : {}),
    });
    window.dispatchEvent(new Event('settings_updated'));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

export const subscribeToSettings = (callback: () => void) => {
  window.addEventListener('settings_updated', callback);
  return () => {
    window.removeEventListener('settings_updated', callback);
  };
};
