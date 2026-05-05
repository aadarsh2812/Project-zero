/* ============================================================
   Kitchen Order Service
   - LocalStorage persistence (2-hour TTL)
   - Immutable timestamp-based timing queue
   - Cross-tab sync via storage events
   ============================================================ */

export type OrderStatus = 'ORDERED' | 'PREPARING' | 'READY' | 'SERVED';

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface ActiveOrder {
  orderId: string;
  tableNo: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  timestamp: number;          // When order was placed (immutable)
  prepStartedAt?: number;     // When kitchen started preparing
  readyAt?: number;           // When marked ready
  servedAt?: number;          // When served/closed
  paymentStatus: 'PENDING' | 'PAID';
  paymentMethod?: 'ONLINE' | 'CASH';
}

export interface QueueEntry {
  orderId: string;
  enqueuedAt: number;
  priority: number;           // 0 = normal, 1 = rush (>15min waiting)
}

import api from './api';

const QUEUE_KEY = 'kitchen_queue';
const STORAGE_KEY = 'active_orders';
const RUSH_THRESHOLD_MS = 15 * 60000;

const dispatchUpdate = () => {
  window.dispatchEvent(new Event('orders_updated'));
};

// ---- Orders CRUD ----

export const getOrders = async (hotelId?: string): Promise<ActiveOrder[]> => {
  try {
    const response = await api.get('/orders', { params: { hotelId } });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    return [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
};

export const getOrderById = async (orderId: string, hotelId?: string) => {
  try {
    const params = hotelId ? { hotelId } : {};
    const res = await api.get(`/orders/${orderId}`, { params });
    return res.data;
  } catch (error) {
    console.error('Failed to get order by id', error);
    return undefined;
  }
};

export const getActiveOrders = async (hotelId?: string): Promise<ActiveOrder[]> => {
  const orders = await getOrders(hotelId);
  return orders.filter(o => o.status !== 'SERVED');
};

export const getOrdersByStatus = async (status: OrderStatus, hotelId?: string): Promise<ActiveOrder[]> => {
  const orders = await getOrders(hotelId);
  return orders.filter(o => o.status === status);
};

export const saveOrder = async (order: ActiveOrder, hotelId?: string): Promise<void> => {
  try {
    await api.post('/orders', order, { params: { hotelId } });
    dispatchUpdate();
  } catch (error) {
    console.error('Failed to save order:', error);
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  try {
    await api.patch(`/orders/${orderId}/status`, status);
    dispatchUpdate();
  } catch (error) {
    console.error('Failed to update order status:', error);
  }
};

export const updateOrderPayment = async (orderId: string, status: 'PENDING' | 'PAID', method?: 'ONLINE' | 'CASH'): Promise<void> => {
  try {
    await api.patch(`/orders/${orderId}/payment`, { paymentStatus: status, paymentMethod: method });
    dispatchUpdate();
  } catch (error) {
    console.error('Failed to update order payment:', error);
  }
};

export const clearAllOrders = async (): Promise<void> => {
  // Not implemented in backend for safety, but could be a delete all endpoint
  console.warn('Clear all orders not implemented in backend');
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await api.delete(`/orders/${orderId}`);
    dispatchUpdate();
  } catch (error) {
    console.error('Failed to delete order:', error);
  }
};


// ---- Timing Queue ----

export const getQueue = (): QueueEntry[] => {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const enqueueOrder = (orderId: string): void => {
  const queue = getQueue();
  if (!queue.find(q => q.orderId === orderId)) {
    queue.push({ orderId, enqueuedAt: Date.now(), priority: 0 });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
};

const dequeueOrder = (orderId: string): void => {
  const queue = getQueue().filter(q => q.orderId !== orderId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

/** Refresh priority flags — call every minute */
export const refreshQueuePriority = (): void => {
  const now = Date.now();
  const queue = getQueue().map(entry => ({
    ...entry,
    priority: (now - entry.enqueuedAt) >= RUSH_THRESHOLD_MS ? 1 : 0,
  }));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const isRushOrder = (orderId: string): boolean => {
  const entry = getQueue().find(q => q.orderId === orderId);
  return entry ? entry.priority === 1 : false;
};

// ---- Elapsed Helpers ----

export const elapsedMs = (ts: number): number => Date.now() - ts;
export const elapsedDisplay = (ts: number): string => {
  const ms = elapsedMs(ts);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// ---- Stats ----

export interface KitchenStats {
  totalToday: number;
  avgPrepTimeMs: number;
  servedToday: number;
  pendingCount: number;
}

export const getKitchenStats = async (hotelId?: string): Promise<KitchenStats> => {
  const orders = await getOrders(hotelId);
  const served = orders.filter(o => o.status === 'SERVED' && o.prepStartedAt && o.readyAt);

  const avgPrepTimeMs = served.length
    ? served.reduce((sum, o) => sum + (o.readyAt! - o.prepStartedAt!), 0) / served.length
    : 0;

  return {
    totalToday: orders.length,
    avgPrepTimeMs,
    servedToday: served.length,
    pendingCount: orders.filter(o => o.status !== 'SERVED').length,
  };
};

// ---- Subscription ----

export const subscribeToOrders = (callback: () => void) => {
  window.addEventListener('storage', callback);
  window.addEventListener('orders_updated', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('orders_updated', callback);
  };
};

// ---- Seed demo data (dev only) ----

export const seedDemoOrders = async (): Promise<void> => {
  const existing = await getOrders();
  if (Array.isArray(existing) && existing.length > 0) return;

  const now = Date.now();
  const demoOrders: ActiveOrder[] = [
    {
      orderId: '#A001', tableNo: '3', status: 'ORDERED', timestamp: now - 3 * 60000,
      totalAmount: 420,
      paymentStatus: 'PENDING',
      items: [
        { id: '1', name: 'Chicken Biryani', qty: 2, price: 160 },
        { id: '2', name: 'Raita', qty: 1, price: 40 },
        { id: '3', name: 'Coke 500ml', qty: 2, price: 60 },
      ],
    },
    {
      orderId: '#A002', tableNo: '7', status: 'PREPARING', timestamp: now - 12 * 60000,
      prepStartedAt: now - 8 * 60000,
      totalAmount: 280,
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE',
      items: [
        { id: '4', name: 'Paneer Tikka', qty: 1, price: 180 },
        { id: '5', name: 'Garlic Naan', qty: 2, price: 50 },
      ],
    },
    {
      orderId: '#A003', tableNo: '2', status: 'READY', timestamp: now - 20 * 60000,
      prepStartedAt: now - 17 * 60000,
      readyAt: now - 5 * 60000,
      totalAmount: 350,
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE',
      items: [
        { id: '6', name: 'Dal Makhani', qty: 1, price: 140 },
        { id: '7', name: 'Butter Roti', qty: 4, price: 80 },
        { id: '8', name: 'Lassi', qty: 2, price: 130 },
      ],
    },
  ];

  for (const order of demoOrders) {
    await saveOrder(order);
  }

  const queue: QueueEntry[] = demoOrders.filter(o => o.status !== 'SERVED').map(o => ({
    orderId: o.orderId,
    enqueuedAt: o.timestamp,
    priority: (now - o.timestamp) >= RUSH_THRESHOLD_MS ? 1 : 0,
  }));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  dispatchUpdate();
};
