import axios from 'axios'

// Use VITE_API_URL env var when set (e.g. dev tunnels), otherwise fall back to same-host port 8080
const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`

const api = axios.create({ baseURL: BASE })

export const registerCustomer = (data) => api.post('/api/customer/register', data)
export const validateToken    = (data) => api.post('/api/customer/validate', data)
export const getMenu          = (hotelId) => api.get(`/api/menu/${hotelId}`)
export const placeOrder       = (data) => api.post('/api/orders', data)
export const getMyOrders      = (token) => api.get(`/api/orders/customer?token=${token}`)

export default api
