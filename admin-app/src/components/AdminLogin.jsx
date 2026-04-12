import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography, Space, message } from 'antd'
import { LockOutlined, UserOutlined, DashboardOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Title, Text } = Typography

export default function AdminLogin({ onLogin }) {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await api.post(`/api/admin/login`, values)
      const data = res.data
      localStorage.setItem('admin_token', data.token)
      onLogin(data)
    } catch {
      message.error('Invalid credentials. Use admin / admin123')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)' }}>
      <Card style={{ width: 400, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1677ff, #4096ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DashboardOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
          <Text type="secondary">Hotel Management System</Text>
        </Space>
        <Form onFinish={onFinish} layout="vertical" size="large" initialValues={{ username: 'admin', password: 'admin123' }}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, borderRadius: 8 }}>
            Sign In
          </Button>
        </Form>
      </Card>
    </div>
  )
}
