import React, { useState } from 'react'
import { Card, Input, Button, Space, Typography, Tag, Divider, Alert, List, message, Radio, Result } from 'antd'
import { SearchOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Title, Text } = Typography

export default function OfflinePayment() {
  const [searchRef, setSearchRef]   = useState('')
  const [order, setOrder]           = useState(null)
  const [notFound, setNotFound]     = useState(false)
  const [searching, setSearching]   = useState(false)
  const [payMethod, setPayMethod]   = useState('CASH')
  const [paying, setPaying]         = useState(false)
  const [paid, setPaid]             = useState(false)

  const searchOrder = async () => {
    if (!searchRef.trim()) return
    setSearching(true); setNotFound(false); setOrder(null); setPaid(false)
    try {
      const ref = searchRef.trim().toUpperCase()
      const r = await api.get(`/api/orders/ref/${ref.startsWith('ORD-') ? ref : 'ORD-' + ref}`)
      setOrder(r.data)
    } catch {
      setNotFound(true)
    } finally { setSearching(false) }
  }

  const processPayment = async () => {
    setPaying(true)
    try {
      await api.post('/api/admin/offline-payment', {
        orderRef: order.orderRef,
        method: payMethod
      })
      setPaid(true)
      message.success(`Order ${order.orderRef} paid via ${payMethod}`)
    } catch (e) {
      message.error(e.response?.data?.error || 'Payment failed')
    } finally { setPaying(false) }
  }

  const reset = () => {
    setOrder(null); setSearchRef(''); setPaid(false); setNotFound(false)
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #52c41a, #73d13d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <DollarOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <Title level={4} style={{ margin: 0 }}>Emergency Offline Payment</Title>
            <Text type="secondary">Search by short order ID to process cash/card payment</Text>
          </div>

          <Alert
            message="How it works"
            description="Customer shows you their Order ID (e.g. ORD-001). Search it here, then mark as paid via Cash or Card. This closes their session in Redis."
            type="info" showIcon
          />

          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="large" placeholder="Enter order ID (e.g. 001 or ORD-001)"
              value={searchRef} onChange={e => setSearchRef(e.target.value)}
              onPressEnter={searchOrder}
              prefix={<Text type="secondary">#</Text>}
            />
            <Button type="primary" size="large" icon={<SearchOutlined />}
              loading={searching} onClick={searchOrder}>Search</Button>
          </Space.Compact>

          {notFound && <Alert message="Order not found. Check the ID and try again." type="error" showIcon />}

          {paid && (
            <Result status="success" title="Payment Processed!"
              subTitle={`Order ${order?.orderRef} marked as paid via ${payMethod}.`}
              extra={<Button onClick={reset}>Process Another</Button>} />
          )}

          {order && !paid && (
            <Card style={{ borderRadius: 10, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Title level={5} style={{ margin: 0 }}>{order.orderRef}</Title>
                <Tag color={order.status === 'PAID' ? 'default' : 'blue'}>{order.status}</Tag>
              </div>
              <Text type="secondary">Table {order.tableNo}</Text>
              <Divider style={{ margin: '10px 0' }} />
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.quantity}× {item.itemName}</Text>
                  <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </div>
              ))}
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 16 }}>Total</Text>
                <Text strong style={{ fontSize: 16, color: '#52c41a' }}>₹{order.totalAmount}</Text>
              </div>

              {order.status !== 'PAID' ? (
                <>
                  <Divider />
                  <Text strong>Payment Method:</Text>
                  <Radio.Group value={payMethod} onChange={e => setPayMethod(e.target.value)}
                    style={{ display: 'block', margin: '8px 0 16px' }}>
                    <Radio.Button value="CASH">Cash</Radio.Button>
                    <Radio.Button value="CARD">Card</Radio.Button>
                  </Radio.Group>
                  <Button type="primary" block size="large" icon={<CheckCircleOutlined />}
                    loading={paying} onClick={processPayment}
                    style={{ background: '#52c41a', border: 'none', borderRadius: 8 }}>
                    Confirm Payment via {payMethod}
                  </Button>
                </>
              ) : (
                <Alert style={{ marginTop: 12 }} message={`Already paid via ${order.paidVia}`} type="warning" showIcon />
              )}
            </Card>
          )}
        </Space>
      </Card>
    </div>
  )
}
