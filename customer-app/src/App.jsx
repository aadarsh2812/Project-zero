import React, { useState, useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'
import CustomerIdentity from './components/CustomerIdentity.jsx'
import MenuPage from './components/MenuPage.jsx'
import OrderStatus from './components/OrderStatus.jsx'

// QR URL: http://localhost:3000?hotelId=1&tableNo=5
function getQrParams() {
  const p = new URLSearchParams(window.location.search)
  return { hotelId: p.get('hotelId') || '1', tableNo: p.get('tableNo') || '1' }
}

export default function App() {
  const { hotelId, tableNo } = getQrParams()
  const [session, setSession]   = useState(null)
  const [page, setPage]         = useState('menu')  // 'menu' | 'orders'
  const [cart, setCart]         = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('customer_token')
    if (!stored) return
    import('./api.js').then(({ validateToken }) => {
      validateToken({ token: stored, hotelId: Number(hotelId), tableNo })
        .then(r => setSession(r.data))
        .catch(() => localStorage.removeItem('customer_token'))
    })
  }, [])

  const onSessionReady = (sess) => {
    localStorage.setItem('customer_token', sess.token)
    setSession(sess)
  }

  if (!session) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#fa541c' } }}>
        <CustomerIdentity hotelId={Number(hotelId)} tableNo={tableNo} onReady={onSessionReady} />
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#fa541c' } }}>
      {page === 'menu' ? (
        <MenuPage
          session={session}
          cart={cart}
          setCart={setCart}
          onViewOrders={() => setPage('orders')}
        />
      ) : (
        <OrderStatus
          session={session}
          onBack={() => setPage('menu')}
        />
      )}
    </ConfigProvider>
  )
}
