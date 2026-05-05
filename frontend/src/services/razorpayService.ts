/**
 * Razorpay integration utility.
 * Dynamically loads the Razorpay checkout script and exposes a clean
 * `openRazorpay()` helper used by Checkout and OrderStatus pages.
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptLoaded = false;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (scriptLoaded && window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface RazorpayOptions {
  keyId: string;
  amount: number;          // in paise (multiply ₹ × 100)
  currency?: string;
  name: string;
  description?: string;
  orderId?: string;        // Razorpay order ID (from backend if using Orders API)
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => void;
  onDismiss?: () => void;
}

export const openRazorpay = async (options: RazorpayOptions): Promise<void> => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    alert('Failed to load payment gateway. Please check your internet connection and try again.');
    return;
  }

  if (!options.keyId || options.keyId.trim() === '') {
    alert('Payment gateway is not configured for this restaurant. Please contact the administrator.');
    return;
  }

  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: Math.round(options.amount * 100), // paise
    currency: options.currency || 'INR',
    name: options.name,
    description: options.description || 'Food Order Payment',
    order_id: options.orderId,
    prefill: options.prefill || {},
    theme: { color: options.theme?.color || '#4F46E5' },
    handler: options.onSuccess,
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
  });

  rzp.open();
};
