import React, { useState } from 'react'
import { ConfigProvider } from 'antd'
import AdminLogin from './components/AdminLogin.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

export default function App() {
  const [adminData, setAdminData] = useState(null)

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
      {adminData
        ? <AdminDashboard adminData={adminData} onLogout={() => setAdminData(null)} />
        : <AdminLogin onLogin={setAdminData} />}
    </ConfigProvider>
  )
}
