import React, { useState, useEffect } from 'react'
import { Card, Input, Button, Space, message, Typography, Divider, Alert } from 'antd'
import { SafetyOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Title, Text } = Typography

export default function RazorpaySettings({ hotelId }) {
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [currentConfig, setCurrentConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/admin/${hotelId}/razorpay-config`)
      .then(r => { setCurrentConfig(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [hotelId])

  const handleSave = async () => {
    if (!keyId.trim()) { message.warning('Key ID is required'); return }
    if (!keySecret.trim()) { message.warning('Key Secret is required'); return }
    setSaving(true)
    try {
      await api.put(`/api/admin/${hotelId}/razorpay-config`, { keyId, keySecret })
      message.success('Razorpay configuration saved successfully!')
      setCurrentConfig({ keyId: keyId.substring(0, 12) + '...', hasSecret: true })
      setKeyId('')
      setKeySecret('')
    } catch (e) {
      message.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <SafetyOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>Razorpay Payment Gateway</Title>
          <Text type="secondary">Configure your Razorpay API keys for online payments</Text>
        </div>

        {/* Current status */}
        {currentConfig && (
          <Alert
            type={currentConfig.hasSecret ? 'success' : 'warning'}
            message={currentConfig.hasSecret
              ? `✅ Configured — Key: ${currentConfig.keyId}`
              : '⚠️ Not configured — Online payments are disabled'}
            style={{ marginBottom: 20, borderRadius: 10 }}
          />
        )}

        <Divider>Update Keys</Divider>

        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>API Key ID</Text>
            <Input
              placeholder="rzp_test_xxxxxxxxxxxx or rzp_live_xxxxxxxxxxxx"
              value={keyId}
              onChange={e => setKeyId(e.target.value)}
              style={{ borderRadius: 10 }}
              size="large"
            />
          </div>

          <div>
            <Text strong style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>API Key Secret</Text>
            <Input.Password
              placeholder="Your Razorpay Key Secret"
              value={keySecret}
              onChange={e => setKeySecret(e.target.value)}
              style={{ borderRadius: 10 }}
              size="large"
            />
          </div>

          <Button
            type="primary" block size="large" loading={saving}
            icon={<SaveOutlined />}
            onClick={handleSave}
            style={{ borderRadius: 12, height: 48, fontWeight: 600 }}
          >
            Save Configuration
          </Button>
        </Space>

        <Divider />
        <Text type="secondary" style={{ fontSize: 11 }}>
          🔒 Your secret key is encrypted and never displayed after saving.
          Get your keys from{' '}
          <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener">
            Razorpay Dashboard → Settings → API Keys
          </a>
        </Text>
      </Card>
    </div>
  )
}
