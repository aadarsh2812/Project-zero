import React, { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import AdminLogin from './components/AdminLogin.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

export default function App() {
  const [adminData, setAdminData] = useState(null)

  // Restore session from localStorage on page load
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const stored = localStorage.getItem('admin_data')
    if (token && stored) {
      try { setAdminData(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  const handleLogin = (data) => {
    localStorage.setItem('admin_data', JSON.stringify(data))
    setAdminData(data)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    setAdminData(null)
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
      {adminData
        ? <AdminDashboard hotelId={adminData.hotelId} hotelName={adminData.hotelName} onLogout={handleLogout} />
        : <AdminLogin onLogin={handleLogin} />}
    </ConfigProvider>
  )
}

