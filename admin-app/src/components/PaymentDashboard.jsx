import React, { useState } from 'react'
import { Card, Input, Button, Space, message, Typography, Divider, Alert, Tag } from 'antd'
import { SearchOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Title, Text } = Typography

export default function PaymentDashboard({ hotelId }) {
  const [orderRef, setOrderRef] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleSearch = async () => {
    if (!orderRef.trim()) { message.warning('Enter an order reference'); return }
    setConfirmed(false)
    try {
      const r = await api.get(`/api/orders/ref/${orderRef.trim()}`)
      setSearchResult(r.data)
    } catch {
      setSearchResult(null)
      message.error('Order not found. Check the reference.')
    }
  }

  const handleConfirmCash = async () => {
    setConfirming(true)
    try {
      await api.post('/api/admin/cash-confirm', { orderRef: searchResult.orderRef })
      message.success(`✅ Cash payment confirmed for ${searchResult.orderRef}!`)
      setConfirmed(true)
    } catch (e) {
      message.error(e.response?.data?.message || e.response?.data?.error || 'Failed to confirm payment')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #52c41a, #73d13d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <DollarOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>Cash Payment Verification</Title>
          <Text type="secondary">Search by order reference to verify and confirm cash payments</Text>
        </div>

        <Divider />

        <Space style={{ width: '100%' }} direction="vertical" size={16}>
          <Input
            size="large"
            placeholder="Enter Order Ref (e.g. ORD-A1B2C3)"
            value={orderRef}
            onChange={e => setOrderRef(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            style={{ borderRadius: 12 }}
          />
          <Button type="primary" block size="large" onClick={handleSearch}
            style={{ borderRadius: 12, height: 48 }}>
            Search Order
          </Button>
        </Space>

        {searchResult && (
          <div style={{ marginTop: 24 }}>
            <Divider />
            <Card size="small" style={{ borderRadius: 12, background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <Text strong style={{ fontFamily: 'monospace', fontSize: 18 }}>{searchResult.orderRef}</Text>
                  <br />
                  <Text type="secondary">🪑 Table {searchResult.tableNo}</Text>
                </div>
                <Tag color={searchResult.status === 'PAID' ? 'green' : 'orange'}
                  style={{ fontSize: 14, padding: '4px 12px', borderRadius: 10 }}>
                  {searchResult.status}
                </Tag>
              </div>

              {(searchResult.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <Text>{item.quantity}× {item.itemName}</Text>
                  <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </div>
              ))}

              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>₹{searchResult.totalAmount}</Title>
              </div>
            </Card>

            {confirmed ? (
              <Alert type="success" showIcon icon={<CheckCircleOutlined />}
                message="Cash payment confirmed successfully!"
                style={{ marginTop: 16, borderRadius: 10 }} />
            ) : searchResult.status === 'PAID' ? (
              <Alert type="info" message="This order is already paid."
                style={{ marginTop: 16, borderRadius: 10 }} />
            ) : (
              <Button type="primary" block size="large" loading={confirming}
                onClick={handleConfirmCash}
                icon={<CheckCircleOutlined />}
                style={{
                  marginTop: 16, height: 52, borderRadius: 14, fontWeight: 600, fontSize: 16,
                  background: 'linear-gradient(135deg, #52c41a, #73d13d)', border: 'none',
                }}>
                ✅ Confirm Cash Payment — ₹{searchResult.totalAmount}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
