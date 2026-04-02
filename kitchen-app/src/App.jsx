import React, { useState } from 'react'
import { ConfigProvider } from 'antd'
import KitchenLogin from './components/KitchenLogin.jsx'
import KitchenDashboard from './components/KitchenDashboard.jsx'

export default function App() {
  const [hotelId, setHotelId] = useState(null)

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#722ed1' } }}>
      {hotelId
        ? <KitchenDashboard hotelId={hotelId} onLogout={() => setHotelId(null)} />
        : <KitchenLogin onLogin={setHotelId} />}
    </ConfigProvider>
  )
}
