import React, { useState, useEffect, Component } from 'react'
import { ConfigProvider, App as AntApp, Spin, Result, Button } from 'antd'
import CustomerIdentity from './components/CustomerIdentity.jsx'
import MenuPage from './components/MenuPage.jsx'
import OrderStatus from './components/OrderStatus.jsx'
import PaymentScreen from './components/PaymentScreen.jsx'
import ThankYou from './components/ThankYou.jsx'
import { I18nProvider } from './i18n/index.jsx'
import { getHotelConfig, validateToken } from './api.js'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'

/* ===== Error Boundary ===== */
class ErrorBoundary extends Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(err, info) { console.error('[ErrorBoundary]', err, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <Result
            status="warning"
            title="Oops! Something went wrong"
            subTitle="Don't worry, just refresh the page to continue."
            extra={<Button type="primary" size="large" className="btn-primary"
              onClick={() => window.location.reload()}>Refresh Page</Button>}
          />
        </div>
      )
    }
    return this.props.children
  }
}

function getQrParams() {
  const p = new URLSearchParams(window.location.search)
  return { hotelId: p.get('hotelId') || '1', tableNo: p.get('tableNo') || '1' }
}

export default function App() {
  const { hotelId, tableNo } = getQrParams()
  const [session, setSession]   = useState(null)
  const [page, setPage]         = useState('menu') // menu | orders | payment | thankyou
  const [cart, setCart]          = useState([])
  const [bill, setBill]         = useState(null)

  const [config, setConfig]     = useState({
    primaryColor: '#ff6b35',
    secondaryColor: '#ff8f66',
    fontFamily: 'Inter, sans-serif',
    appName: 'Hotel Menu'
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    getHotelConfig(Number(hotelId)).then(r => {
      if(r.data) setConfig(r.data);
      setLoadingConfig(false);
    }).catch(() => setLoadingConfig(false));

    const stored = localStorage.getItem('customer_token')
    if (!stored) return
    validateToken({ token: stored, hotelId: Number(hotelId), tableNo })
      .then(r => setSession(r.data))
      .catch(() => localStorage.removeItem('customer_token'))
  }, [])

  const onSessionReady = (sess) => {
    localStorage.setItem('customer_token', sess.token)
    setSession(sess)
  }

  // Fix #2 & #10: Full session reset after payment
  const handleNewSession = () => {
    localStorage.removeItem('customer_token')
    setSession(null)
    setPage('menu')
    setCart([])
    setBill(null)
  }

  if (loadingConfig) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#999', fontFamily: 'Inter, sans-serif' }}>Loading your menu...</p>
        </div>
      </div>
    );
  }

  const themeToken = {
    colorPrimary: config.primaryColor || '#ff6b35',
    fontFamily: config.fontFamily || 'Inter, sans-serif',
    borderRadius: 12,
  }

  return (
    <ErrorBoundary>
      <I18nProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "123456789-placeholder.apps.googleusercontent.com"}>
        <ConfigProvider theme={{
          token: themeToken,
          components: {
            Button: { borderRadius: 20 },
            Card: { borderRadius: 16 },
            Input: { borderRadius: 12 },
          }
        }}>
          <AntApp>
            {!session ? (
              <CustomerIdentity
                hotelId={Number(hotelId)}
                tableNo={tableNo}
                config={config}
                onReady={onSessionReady}
              />
            ) : page === 'menu' ? (
              <MenuPage
                session={session}
                config={config}
                cart={cart}
                setCart={setCart}
                onViewOrders={() => setPage('orders')}
              />
            ) : page === 'orders' ? (
              <OrderStatus
                session={session}
                config={config}
                onBack={() => setPage('menu')}
                onPaymentReady={(b) => {
                  setBill(b);
                  setPage('payment');
                }}
              />
            ) : page === 'payment' ? (
              <PaymentScreen
                session={session}
                config={config}
                bill={bill}
                onPaymentComplete={() => setPage('thankyou')}
                onBack={() => setPage('orders')}
              />
            ) : (
              <ThankYou
                session={session}
                config={config}
                bill={bill}
                onNewSession={handleNewSession}
              />
            )}
          </AntApp>
        </ConfigProvider>
      </GoogleOAuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
