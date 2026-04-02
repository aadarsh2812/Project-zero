import React, { useState, useEffect, useRef } from 'react'
import { Layout, Typography, Card, Tag, List, Button, Spin, Empty, Steps, Space, message } from 'antd'
import { ArrowLeftOutlined, ClockCircleOutlined, FireOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getMyOrders } from '../api.js'
import { Client } from '@stomp/stompjs'

const { Header, Content } = Layout
const { Title, Text } = Typography

const STATUS_CONFIG = {
  RECEIVED:  { color: 'blue',    label: 'Order Received',  icon: <ClockCircleOutlined /> },
  PREPARING: { color: 'orange',  label: 'Preparing',       icon: <FireOutlined /> },
  READY:     { color: 'green',   label: 'Ready to Serve',  icon: <CheckCircleOutlined /> },
  PAID:      { color: 'default', label: 'Paid',            icon: <CheckCircleOutlined /> },
}

const STATUS_STEPS = ['RECEIVED', 'PREPARING', 'READY']

export default function OrderStatus({ session, onBack }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const stompClient           = useRef(null)

  const fetchOrders = () =>
    getMyOrders(session.token)
      .then(r => { setOrders(r.data); setLoading(false) })
      .catch(() => setLoading(false))

  useEffect(() => {
    fetchOrders()

    const client = new Client({
      brokerURL: `ws://${window.location.hostname}:8080/ws`,
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/customer/${session.customerId}/status`, (msg) => {
          const update = JSON.parse(msg.body)
          setOrders(prev => prev.map(o =>
            o.orderRef === update.orderRef ? { ...o, status: update.status } : o
          ))
          const cfg = STATUS_CONFIG[update.status]
          if (cfg) message.info(`Order ${update.orderRef}: ${cfg.label}`)
        })
      }
    })
    client.activate()
    stompClient.current = client
    return () => client.deactivate()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{
        background: 'linear-gradient(135deg, #fa541c, #ff7a45)', padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100
      }}>
        <Button icon={<ArrowLeftOutlined />} type="text" style={{ color: '#fff' }} onClick={onBack} />
        <div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>My Orders</Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
            Table {session.tableNo} • Live updates
          </Text>
        </div>
      </Header>

      <Content style={{ padding: 16 }}>
        {!orders.length
          ? <Empty description="No orders yet" style={{ marginTop: 64 }} />
          : (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {orders.map(order => {
                const stepIdx = STATUS_STEPS.indexOf(order.status)
                const cfg     = STATUS_CONFIG[order.status] || {}
                return (
                  <Card key={order.id} style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>{order.orderRef}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>Table {order.tableNo}</Text>
                      </div>
                      <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 13, padding: '4px 10px' }}>
                        {cfg.label}
                      </Tag>
                    </div>

                    {order.status !== 'PAID' && (
                      <Steps size="small" current={stepIdx === -1 ? 0 : stepIdx} style={{ marginBottom: 12 }}
                        items={[
                          { title: 'Received',  icon: <ClockCircleOutlined /> },
                          { title: 'Preparing', icon: <FireOutlined /> },
                          { title: 'Ready',     icon: <CheckCircleOutlined /> },
                        ]} />
                    )}

                    <List size="small" dataSource={order.items || []} renderItem={item => (
                      <List.Item style={{ padding: '4px 0' }}>
                        <Text>{item.quantity}× {item.itemName}</Text>
                        <Text type="secondary">${(item.price * item.quantity).toFixed(2)}</Text>
                      </List.Item>
                    )} />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <Text strong style={{ color: '#fa541c' }}>Total: ${order.totalAmount}</Text>
                    </div>
                  </Card>
                )
              })}
            </Space>
          )}
      </Content>
    </Layout>
  )
}
