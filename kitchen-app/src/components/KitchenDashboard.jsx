import React, { useState, useEffect, useRef } from 'react'
import {
  Layout, Typography, Card, Tag, Button, Badge, Row, Col,
  Space, Spin, message, Statistic, Divider, Empty
} from 'antd'
import {
  FireOutlined, CheckCircleOutlined, ClockCircleOutlined,
  LogoutOutlined, ThunderboltOutlined, SyncOutlined,
  BellOutlined, SoundOutlined
} from '@ant-design/icons'
import api from '../api.js'
import { Client } from '@stomp/stompjs'
import { speakOrderForKitchen } from '../utils/voice.js'
import { kitchenEN, kitchenTA } from '../i18n/kitchen.js'

const { Header, Content } = Layout
const { Title, Text } = Typography

const COLS = [
  { status: 'RECEIVED',  icon: <ClockCircleOutlined />, bg: '#e6f7ff', border: '#91d5ff', glow: '#1890ff' },
  { status: 'PREPARING', icon: <FireOutlined />,        bg: '#fff7e6', border: '#ffd591', glow: '#fa8c16' },
  { status: 'READY',     icon: <CheckCircleOutlined />, bg: '#f6ffed', border: '#b7eb8f', glow: '#52c41a' },
]


function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
  } catch (e) { /* ignore */ }
}

function OrderTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!createdAt) return
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
      setElapsed(`${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [createdAt])
  const mins = parseInt(elapsed.split(':')[0]) || 0
  const color = mins >= 10 ? '#ff4d4f' : mins >= 5 ? '#fa8c16' : 'rgba(255,255,255,0.5)'
  return <Text style={{ fontSize: 11, color, fontFamily: 'monospace', fontWeight: mins >= 5 ? 700 : 400 }}>⏱ {elapsed}</Text>
}

export default function KitchenDashboard({ hotelId, onLogout }) {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [connected, setConnected] = useState(false)
  const [updating, setUpdating]   = useState({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [lang, setLang] = useState(() => localStorage.getItem('kitchen_lang') || 'en')
  const stompClient               = useRef(null)

  const i = lang === 'ta' ? kitchenTA : kitchenEN

  const STATUS = {
    RECEIVED:  { label: i.newOrders,  next: 'PREPARING', nextLabel: i.startPreparing, emoji: '📋' },
    PREPARING: { label: i.preparing,  next: 'READY',     nextLabel: i.markReady,      emoji: '👨‍🍳' },
    READY:     { label: i.ready,      next: null,        nextLabel: null,              emoji: '✅' },
  }

  const toggleLang = () => {
    const next = lang === 'en' ? 'ta' : 'en'
    setLang(next)
    localStorage.setItem('kitchen_lang', next)
  }

  const fetchOrders = async () => {
    try {
      const r = await api.get(`/api/orders/hotel/${hotelId}/active`)
      setOrders(r.data)
    } catch { message.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchOrders()
    const client = new Client({
      brokerURL: import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/hotel/${hotelId}/kitchen`, (msg) => {
          const order = JSON.parse(msg.body)
          setOrders(prev => {
            if (order.status === 'PAID') return prev.filter(o => o.orderRef !== order.orderRef)
            const exists = prev.find(o => o.orderRef === order.orderRef)
            if (exists) return prev.map(o => o.orderRef === order.orderRef ? { ...o, ...order } : o)
            return [order, ...prev]
          })
          if (order.status === 'RECEIVED') {
            if (soundEnabled) playNotificationSound()
            // Voice announcement for kitchen
            if (voiceEnabled) speakOrderForKitchen(order, lang)
            message.success({
              content: `🔔 ${i.newOrder} ${order.orderRef} — ${i.table} ${order.tableNo}`,
              duration: 8, style: { fontWeight: 600 },
            })
          }
        })
      },
      onDisconnect: () => setConnected(false),
    })
    client.activate()
    stompClient.current = client
    return () => client.deactivate()
  }, [hotelId])

  const updateStatus = async (orderRef, status) => {
    setUpdating(p => ({ ...p, [orderRef]: true }))
    try {
      await api.patch('/api/orders/status', { orderRef, status })
      setOrders(prev => prev.map(o => o.orderRef === orderRef ? { ...o, status } : o))
      message.success(`${STATUS[status]?.emoji || '✓'} ${orderRef} → ${STATUS[status]?.label}`)
    } catch { message.error('Failed to update status') }
    finally { setUpdating(p => ({ ...p, [orderRef]: false })) }
  }

  const byStatus = (s) => orders.filter(o => o.status === s)

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d0d1a' }}>
      <Header style={{
        background: 'linear-gradient(90deg, #1a0533, #2d1b69)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}>
        <Space>
          <ThunderboltOutlined style={{ fontSize: 24, color: '#b37feb' }} />
          <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>{i.title}</Title>
          <Badge status={connected ? 'success' : 'error'}
            text={<Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{connected ? i.live : i.connecting}</Text>} />
        </Space>
        <Space>
          <Button onClick={toggleLang}
            style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}>
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </Button>
          <Button icon={<SoundOutlined />}
            onClick={() => { setVoiceEnabled(!voiceEnabled); message.info(voiceEnabled ? i.voiceOff : i.voiceOn) }}
            style={{
              color: '#fff', border: `1px solid ${voiceEnabled ? '#52c41a' : 'rgba(255,255,255,0.2)'}`,
              background: voiceEnabled ? 'rgba(82,196,26,0.2)' : 'transparent', borderRadius: 8,
            }}>
            {voiceEnabled ? i.voiceOn : i.voiceOff}
          </Button>
          <Button icon={<BellOutlined />}
            onClick={() => { setSoundEnabled(!soundEnabled); message.info(soundEnabled ? i.soundOff : i.soundOn) }}
            style={{
              color: '#fff', border: `1px solid ${soundEnabled ? '#b37feb' : 'rgba(255,255,255,0.2)'}`,
              background: soundEnabled ? 'rgba(179,127,235,0.2)' : 'transparent', borderRadius: 8,
            }}>
            {soundEnabled ? i.soundOn : i.soundOff}
          </Button>
          <Button icon={<SyncOutlined />} onClick={fetchOrders}
            style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', borderRadius: 8 }}>
            {i.refresh}
          </Button>
          <Button icon={<LogoutOutlined />} onClick={onLogout} danger ghost style={{ borderRadius: 8 }}>{i.logout}</Button>
        </Space>
      </Header>

      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px 24px', display: 'flex', gap: 40, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {COLS.map(c => (
          <Statistic key={c.status}
            title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{STATUS[c.status].label}</Text>}
            value={byStatus(c.status).length}
            valueStyle={{ color: c.glow, fontSize: 28, fontWeight: 800 }}
          />
        ))}
        <Statistic
          title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i.totalActive}</Text>}
          value={orders.length}
          valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 800 }}
        />
      </div>

      <Content style={{ padding: 16 }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spin size="large" /></div>
          : (
            <Row gutter={16}>
              {COLS.map(col => (
                <Col xs={24} md={8} key={col.status}>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, minHeight: 400,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ color: col.glow, fontSize: 18 }}>{col.icon}</span>
                      <Text strong style={{ color: '#fff', fontSize: 14 }}>{STATUS[col.status].label}</Text>
                      <Badge count={byStatus(col.status).length} showZero style={{ marginLeft: 'auto', background: col.glow }} />
                    </div>
                    <Space direction="vertical" style={{ width: '100%' }} size={10}>
                      {byStatus(col.status).length === 0
                        ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text style={{ color: 'rgba(255,255,255,0.25)' }}>{i.noOrders}</Text>} />
                        : byStatus(col.status).map(order => (
                          <Card key={order.orderRef}
                            style={{ borderRadius: 12, background: col.bg, border: `1px solid ${col.border}`, transition: 'all 0.3s ease' }}
                            styles={{ body: { padding: 12 } }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <Text strong style={{ fontSize: 15, fontFamily: 'monospace' }}>{order.orderRef}</Text>
                              <Tag style={{ margin: 0, borderRadius: 8 }}>🪑 {i.table} {order.tableNo}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Text type="secondary" style={{ fontSize: 11 }}>{order.customerName}</Text>
                              <OrderTimer createdAt={order.createdAt} />
                            </div>
                            <Divider style={{ margin: '6px 0' }} />
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                  <Text strong style={{ color: col.glow }}>{item.quantity}×</Text> {item.name || item.itemName}
                                </Text>
                              </div>
                            ))}
                            {STATUS[col.status].next && (
                              <>
                                <Divider style={{ margin: '8px 0' }} />
                                <Button block size="small" loading={updating[order.orderRef]}
                                  onClick={() => updateStatus(order.orderRef, STATUS[col.status].next)}
                                  style={{
                                    background: col.status === 'RECEIVED' ? '#fa8c16' : '#52c41a',
                                    border: 'none', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, height: 34,
                                  }}>
                                  {STATUS[col.status].nextLabel}
                                </Button>
                              </>
                            )}
                          </Card>
                        ))}
                    </Space>
                  </div>
                </Col>
              ))}
            </Row>
          )}
      </Content>
    </Layout>
  )
}
