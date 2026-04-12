import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: BASE })

// Global response & error interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Something went wrong'
    console.error('[API Error]', msg)
    return Promise.reject(err)
  }
)

// Global request interceptor to inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Customer
export const registerCustomer = (data) => api.post('/api/customer/register', data)
export const validateToken    = (data) => api.post('/api/customer/validate', data)
export const googleAuthLogin  = (data) => api.post('/api/customer/google-auth', data)

// Menu
export const getMenu          = (hotelId) => api.get(`/api/menu/${hotelId}`)

// Orders
export const placeOrder       = (data) => api.post('/api/orders', data)
export const getMyOrders      = () => api.get(`/api/orders/customer`)

// Config
export const getHotelConfig   = (hotelId) => api.get(`/api/config/${hotelId}`)

// Payment — Session billing
export const finishDining     = () => api.post(`/api/payments/finish-dining`)
export const initiatePayment  = (data) => api.post('/api/payments/initiate', data)
export const verifyPayment    = (data) => api.post('/api/payments/verify', data)

// Payment — Razorpay
export const createRazorpayOrder = (billId) => api.post('/api/payments/razorpay/create-order', { billId })
export const verifyRazorpayPayment = (data) => api.post('/api/payments/razorpay/verify', data)

export default api
