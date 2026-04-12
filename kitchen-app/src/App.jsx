import React, { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import KitchenLogin from './components/KitchenLogin.jsx'
import KitchenDashboard from './components/KitchenDashboard.jsx'

export default function App() {
  const [hotelId, setHotelId] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('kitchen_token')
    const storedId = localStorage.getItem('kitchen_hotelId')
    if (token && storedId) {
      setHotelId(Number(storedId))
    }
  }, [])

  const handleLogin = (id) => {
    localStorage.setItem('kitchen_hotelId', id)
    setHotelId(id)
  }

  const handleLogout = () => {
    localStorage.removeItem('kitchen_token')
    localStorage.removeItem('kitchen_hotelId')
    setHotelId(null)
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#722ed1' } }}>
      {hotelId
        ? <KitchenDashboard hotelId={hotelId} onLogout={handleLogout} />
        : <KitchenLogin onLogin={handleLogin} />}
    </ConfigProvider>
  )
}
