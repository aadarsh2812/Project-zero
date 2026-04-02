import React, { useState, useEffect, useRef } from 'react'
import {
  Layout, Typography, Card, Tag, Button, Badge, Row, Col,
  Space, Spin, message, Statistic, Divider, Empty
} from 'antd'
import {
  FireOutlined, CheckCircleOutlined, ClockCircleOutlined,
  LogoutOutlined, ThunderboltOutlined, SyncOutlined
} from '@ant-design/icons'
import axios from 'axios'
import { Client } from '@stomp/stompjs'

const { Header, Content } = Layout
const { Title, Text } = Typography

const STATUS = {
  RECEIVED:  { color: 'blue',   label: 'Received',  next: 'PREPARING', nextLabel: 'Start Preparing' },
  PREPARING: { color: 'orange', label: 'Preparing', next: 'READY',     nextLabel: 'Mark Ready'       },
  READY:     { color: 'green',  label: 'Ready',     next: null,        nextLabel: null               },
}

const COLS = [
  { status: 'RECEIVED',  icon: <ClockCircleOutlined />, bg: '#e6f7ff', border: '#91d5ff' },
  { status: 'PREPARING', icon: <FireOutlined />,        bg: '#fff7e6', border: '#ffd591' },
  { status: 'READY',     icon: <CheckCircleOutlined />, bg: '#f6ffed', border: '#b7eb8f' },
]

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080' })

export default function KitchenDashboard({ hotelId, onLogout }) {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [connected, setConnected] = useState(false)
  const [updating, setUpdating]   = useState({})
  const stompClient               = useRef(null)

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
      brokerURL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
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
            message.success({
              content: `New order! ${order.orderRef} — Table ${order.tableNo}`,
              duration: 6
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
    } catch { message.error('Failed to update status') }
    finally { setUpdating(p => ({ ...p, [orderRef]: false })) }
  }

  const byStatus = (s) => orders.filter(o => o.status === s)

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d0d1a' }}>
      <Header style={{
        background: 'linear-gradient(90deg, #1a0533, #2d1b69)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px'
      }}>
        <Space>
          <ThunderboltOutlined style={{ fontSize: 24, color: '#b37feb' }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>Kitchen Display System</Title>
          <Badge
            status={connected ? 'success' : 'error'}
            text={<Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {connected ? 'Live' : 'Connecting...'}
            </Text>}
          />
        </Space>
        <Space>
          <Button icon={<SyncOutlined />} onClick={fetchOrders}
            style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent' }}>
            Refresh
          </Button>
          <Button icon={<LogoutOutlined />} onClick={onLogout} danger ghost>Logout</Button>
        </Space>
      </Header>

      {/* Stats bar */}
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 24px', display: 'flex', gap: 32 }}>
        {COLS.map(c => (
          <Statistic key={c.status}
            title={<Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{STATUS[c.status].label}</Text>}
            value={byStatus(c.status).length}
            valueStyle={{
              color: c.status === 'RECEIVED' ? '#1890ff' : c.status === 'PREPARING' ? '#fa8c16' : '#52c41a',
              fontSize: 24
            }}
          />
        ))}
      </div>

      <Content style={{ padding: 16 }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spin size="large" /></div>
          : (
            <Row gutter={16}>
              {COLS.map(col => (
                <Col xs={24} md={8} key={col.status}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                    padding: 12, minHeight: 400
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{
                        color: col.status === 'RECEIVED' ? '#1890ff' : col.status === 'PREPARING' ? '#fa8c16' : '#52c41a',
                        fontSize: 18
                      }}>{col.icon}</span>
                      <Text strong style={{ color: '#fff', fontSize: 15 }}>{STATUS[col.status].label}</Text>
                      <Badge count={byStatus(col.status).length} showZero style={{ marginLeft: 'auto' }} />
                    </div>

                    <Space direction="vertical" style={{ width: '100%' }} size={10}>
                      {byStatus(col.status).length === 0
                        ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text style={{ color: 'rgba(255,255,255,0.3)' }}>No orders</Text>} />
                        : byStatus(col.status).map(order => (
                          <Card key={order.orderRef}
                            style={{ borderRadius: 10, background: col.bg, border: `1px solid ${col.border}` }}
                            bodyStyle={{ padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text strong style={{ fontSize: 15 }}>{order.orderRef}</Text>
                              <Tag style={{ margin: 0 }}>Table {order.tableNo}</Tag>
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{order.customerName}</Text>
                            <Divider style={{ margin: '8px 0' }} />
                            {(order.items || []).map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <Text style={{ fontSize: 13 }}>× {item.quantity} {item.name || item.itemName}</Text>
                              </div>
                            ))}
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                              </Text>
                              {STATUS[col.status].next && (
                                <Button size="small" loading={updating[order.orderRef]}
                                  onClick={() => updateStatus(order.orderRef, STATUS[col.status].next)}
                                  style={{
                                    background: col.status === 'RECEIVED' ? '#fa8c16' : '#52c41a',
                                    border: 'none', color: '#fff', borderRadius: 6, fontSize: 12
                                  }}>
                                  {STATUS[col.status].nextLabel}
                                </Button>
                              )}
                            </div>
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
