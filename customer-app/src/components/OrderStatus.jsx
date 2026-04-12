import React, { useState, useEffect, useRef } from 'react'
import { Layout, Typography, Card, Tag, List, Button, Spin, Empty, Steps, Space, App as AntApp, theme } from 'antd'
import { ArrowLeftOutlined, ClockCircleOutlined, FireOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons'
import { getMyOrders, finishDining } from '../api.js'
import { Client } from '@stomp/stompjs'
import { useI18n, LangToggle } from '../i18n/index.jsx'
import { speakStatusForCustomer } from '../utils/voice.js'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { useToken } = theme

export default function OrderStatus({ session, config, onBack, onPaymentReady }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const stompClient           = useRef(null)
  const { token: { colorPrimary } } = useToken()
  const { t, lang } = useI18n()
  const { message } = AntApp.useApp()

  const STATUS_CONFIG = {
    RECEIVED:  { color: 'blue',    label: t('orderReceived'),  icon: <ClockCircleOutlined />, emoji: '📋' },
    PREPARING: { color: 'orange',  label: t('preparing'),      icon: <FireOutlined />,        emoji: '👨‍🍳' },
    READY:     { color: 'green',   label: t('ready'),          icon: <CheckCircleOutlined />, emoji: '✅' },
    PAID:      { color: 'default', label: t('paid'),           icon: <CheckCircleOutlined />, emoji: '💰' },
  }

  const STATUS_STEPS = ['RECEIVED', 'PREPARING', 'READY']

  const fetchOrders = () =>
    getMyOrders()
      .then(r => { setOrders(r.data); setLoading(false) })
      .catch(() => { message.error('Failed to load orders'); setLoading(false) })

  useEffect(() => {
    fetchOrders()
    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/customer/${session.customerId}/status`, (msg) => {
          const update = JSON.parse(msg.body)
          setOrders(prev => prev.map(o =>
            o.orderRef === update.orderRef ? { ...o, status: update.status } : o
          ))
          const cfg = STATUS_CONFIG[update.status]
          if (cfg) message.info({ content: `${cfg.emoji} ${update.orderRef}: ${cfg.label}`, duration: 4 })

          // Voice announcement for customer
          if (voiceEnabled && document.visibilityState === 'visible') {
            speakStatusForCustomer(update.orderRef, update.status, lang)
          }
        })
      }
    })
    client.activate()
    stompClient.current = client
    return () => client.deactivate()
  }, [])

  const handleFinishDining = async () => {
    setFinishing(true)
    try {
      const resp = await finishDining();
      onPaymentReady(resp.data);
    } catch (e) {
      message.error(e.response?.data?.message || "Unable to generate bill. Please contact staff.");
    } finally {
      setFinishing(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Spin size="large" />
      <Text style={{ color: '#999' }}>Loading your orders...</Text>
    </div>
  )

  // Fix #8: Only show pay button when ALL orders are READY or PAID (not while still cooking)
  const activeOrders = orders.filter(o => o.status !== 'PAID')
  const canPay = activeOrders.length > 0 && activeOrders.every(o => o.status === 'READY')

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Header style={{
        background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
        padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 100, height: 60,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      }}>
        <Button icon={<ArrowLeftOutlined />} type="text" style={{ color: '#fff' }} onClick={onBack} />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: 17 }}>{t('myOrders')}</Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
            🪑 {t('table')} {session.tableNo} • {t('liveUpdates')}
          </Text>
        </div>
        <button onClick={() => setVoiceEnabled(!voiceEnabled)}
          style={{
            background: voiceEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 16,
            padding: '4px 10px', fontSize: 11, cursor: 'pointer',
          }}>
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
        <LangToggle />
      </Header>

      <Content style={{ padding: 16 }}>
        {!orders.length ? (
          <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
            <Title level={4} style={{ color: '#999' }}>{t('noOrders')}</Title>
            <Text type="secondary">{t('browseMenu')}</Text>
            <br /><br />
            <Button type="primary" className="btn-primary" onClick={onBack}>{t('browseMenu')}</Button>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={14}>
            {orders.map((order, idx) => {
              const stepIdx = STATUS_STEPS.indexOf(order.status)
              const cfg = STATUS_CONFIG[order.status] || {}
              return (
                <Card key={order.id || idx}
                  className="animate-fadeInUp glass-card"
                  style={{ animationDelay: `${idx * 0.08}s`, padding: 0 }}
                  styles={{ body: { padding: 16 } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <Text strong style={{ fontSize: 16, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{order.orderRef}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        🪑 {t('table')} {order.tableNo} • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                      </Text>
                    </div>
                    <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12 }}>
                      {cfg.label}
                    </Tag>
                  </div>

                  {order.status !== 'PAID' && (
                    <div style={{ margin: '12px 0' }}>
                      <Steps size="small" current={stepIdx === -1 ? 0 : stepIdx}
                        items={[
                          { title: <Text style={{ fontSize: 11 }}>{t('orderReceived')}</Text>, icon: <ClockCircleOutlined /> },
                          { title: <Text style={{ fontSize: 11 }}>{t('preparing')}</Text>, icon: <FireOutlined /> },
                          { title: <Text style={{ fontSize: 11 }}>{t('ready')}</Text>, icon: <CheckCircleOutlined /> },
                        ]} />
                    </div>
                  )}

                  <div style={{ background: '#fafafa', borderRadius: 10, padding: '8px 12px', margin: '8px 0' }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <Text style={{ fontSize: 13 }}>{item.quantity}× {item.itemName}</Text>
                        <Text style={{ fontSize: 13, color: '#888' }}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <Text strong style={{ color: colorPrimary, fontSize: 15 }}>Total: ₹{order.totalAmount}</Text>
                  </div>
                </Card>
              )
            })}
          </Space>
        )}

        {/* Fix #8: Only show button when all orders are READY */}
        {canPay && (
          <div style={{ marginTop: 32, paddingBottom: 32 }}>
            <Button
              type="primary" size="large" block loading={finishing}
              className="btn-primary"
              style={{
                height: 54, fontSize: 16, fontWeight: 600,
                background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
              }}
              icon={<DollarOutlined />}
              onClick={handleFinishDining}>
              {t('finishDining')}
            </Button>
          </div>
        )}

        {/* Show message if orders still cooking */}
        {activeOrders.length > 0 && !canPay && (
          <div style={{ textAlign: 'center', marginTop: 24, padding: '12px 16px', background: 'rgba(250,140,22,0.08)', borderRadius: 12 }}>
            <Text style={{ color: '#fa8c16', fontSize: 13 }}>
              👨‍🍳 {lang === 'ta' ? 'உங்கள் ஆர்டர்கள் இன்னும் தயாராகவில்லை' : 'Your orders are still being prepared. Payment will be available once all orders are ready.'}
            </Text>
          </div>
        )}
      </Content>
    </Layout>
  )
}
