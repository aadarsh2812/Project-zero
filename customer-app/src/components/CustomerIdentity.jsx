import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography, Space, message } from 'antd'
import { UserOutlined, PhoneOutlined, QrcodeOutlined } from '@ant-design/icons'
import { registerCustomer } from '../api.js'

const { Title, Text } = Typography

export default function CustomerIdentity({ hotelId, tableNo, onReady }) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const res = await registerCustomer({ hotelId, tableNo, name: values.name, phone: values.phone })
      onReady(res.data)
    } catch {
      message.error('Failed to start session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', padding: 24
    }}>
      <Card
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        bordered={false}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fa541c, #ff7a45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <QrcodeOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>Welcome!</Title>
          <Text type="secondary">Table {tableNo} • Please enter your details</Text>
        </Space>

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="name" label="Your Name"
            rules={[{ required: true, message: 'Please enter your name' }]}>
            <Input prefix={<UserOutlined />} placeholder="e.g. John Smith" />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number"
            rules={[{ required: true, message: 'Please enter your phone number' },
                    { pattern: /^\d{10,15}$/, message: 'Enter a valid phone number' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="e.g. 9876543210" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}
              style={{ height: 48, fontSize: 16, borderRadius: 8, background: 'linear-gradient(135deg, #fa541c, #ff7a45)', border: 'none' }}>
              View Menu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
