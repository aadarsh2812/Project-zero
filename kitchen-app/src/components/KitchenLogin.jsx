import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography, Space, message } from 'antd'
import { LockOutlined, UserOutlined, ThunderboltOutlined, BankOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Title, Text } = Typography

export default function KitchenLogin({ onLogin }) {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await api.post(`/api/kitchen/login`, {
        username: values.username,
        password: values.password,
        hotelId: Number(values.hotelId)
      })
      localStorage.setItem('kitchen_token', res.data.token)
      onLogin(res.data.hotelId)
    } catch {
      message.error('Invalid kitchen credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 100%)' }}>
      <Card style={{ width: 380, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #722ed1, #b37feb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ThunderboltOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>Kitchen Display</Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Sign in to view live orders</Text>
        </Space>
        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="hotelId" rules={[{ required: true }]}>
            <Input prefix={<BankOutlined />} placeholder="Hotel ID" type="number" />
          </Form.Item>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}
            style={{ height: 48, background: 'linear-gradient(135deg, #722ed1, #b37feb)', border: 'none', borderRadius: 8 }}>
            Enter Kitchen
          </Button>
        </Form>
      </Card>
    </div>
  )
}
