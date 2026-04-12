import React, { useState } from 'react'
import { Form, Input, Button, Typography, Space, message, Divider } from 'antd'
import { UserOutlined, PhoneOutlined, QrcodeOutlined, GoogleOutlined } from '@ant-design/icons'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import { registerCustomer, googleAuthLogin } from '../api.js'
import { useI18n, LangToggle } from '../i18n/index.jsx'

const { Title, Text } = Typography

const FOOD_EMOJIS = ['🍕', '🍔', '🍣', '🥗', '🍰', '🧁', '☕', '🍜']

export default function CustomerIdentity({ hotelId, tableNo, config, onReady }) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { t } = useI18n()

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const res = await registerCustomer({ hotelId, tableNo, name: values.name, phone: values.phone })
      onReady(res.data)
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to start session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      const res = await googleAuthLogin({ 
        idToken: credentialResponse.credential, 
        hotelId, 
        tableNo 
      })
      message.success(`Welcome, ${res.data.customerName}!`)
      onReady(res.data)
    } catch (err) {
      message.error('Google Sign-In failed')
    } finally {
      setLoading(false)
    }
  }

  const primary = config?.primaryColor || '#ff6b35'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${primary}15 0%, ${primary}08 50%, #f8f9fb 100%)`,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Floating food emojis */}
      {FOOD_EMOJIS.map((emoji, i) => (
        <span key={i} className="animate-float" style={{
          position: 'absolute',
          fontSize: 28 + Math.random() * 16,
          opacity: 0.12,
          top: `${10 + Math.random() * 75}%`,
          left: `${5 + Math.random() * 85}%`,
          animationDelay: `${i * 0.7}s`,
          animationDuration: `${5 + Math.random() * 4}s`,
          pointerEvents: 'none',
        }}>{emoji}</span>
      ))}

      <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo/Icon */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${primary}, ${config?.secondaryColor || '#ff8f66'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${primary}40`,
          }}>
            <QrcodeOutlined style={{ fontSize: 38, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {config?.appName || 'Hotel Menu'}
          </Title>
          <div style={{
            marginTop: 8,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${primary}12`, padding: '6px 16px', borderRadius: 20,
          }}>
            <span style={{ fontSize: 16 }}>🪑</span>
            <Text style={{ color: primary, fontWeight: 600, fontSize: 14 }}>{t('table')} {tableNo}</Text>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '32px 28px' }}>
          <Text style={{ display: 'block', textAlign: 'center', marginBottom: 24, color: '#6b7280', fontSize: 14 }}>
            {t('joinTable')}
          </Text>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => message.error('Google authorization failed')}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="pill"
            />
          </div>

          <Divider style={{ color: '#aaa', fontSize: 12 }}>OR</Divider>

          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large" requiredMark={false}>
            <Form.Item name="name" label={<Text strong style={{ fontSize: 13 }}>{t('yourName')}</Text>}
              rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input
                prefix={<UserOutlined style={{ color: '#bbb' }} />}
                placeholder="e.g. Rahul Sharma"
                style={{ height: 48, borderRadius: 12 }}
              />
            </Form.Item>
            <Form.Item name="phone" label={<Text strong style={{ fontSize: 13 }}>{t('phone')}</Text>}
              rules={[
                { required: true, message: 'Please enter your phone number' },
                { pattern: /^\d{10,15}$/, message: 'Enter a valid 10-digit number' }
              ]}>
              <Input
                prefix={<PhoneOutlined style={{ color: '#bbb' }} />}
                placeholder="e.g. 9876543210"
                maxLength={10}
                style={{ height: 48, borderRadius: 12 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block loading={loading}
                className="btn-primary"
                style={{ height: 52, fontSize: 16 }}>
                🍽️ {t('viewMenu')}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <LangToggle style={{ background: 'rgba(0,0,0,0.04)', color: '#666', border: '1px solid rgba(0,0,0,0.1)' }} />
        </div>
        <Text style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#aaa', fontSize: 12 }}>
          Powered by Project Zero • Secure & Private
        </Text>
      </div>
    </div>
  )
}
