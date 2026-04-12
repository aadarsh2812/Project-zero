import React, { useState } from 'react'
import { Layout, Typography, Button, Rate, Input, message, theme } from 'antd'
import { SmileOutlined, StarOutlined } from '@ant-design/icons'
import { useI18n, LangToggle } from '../i18n/index.jsx'
import axios from 'axios'

const { Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input
const { useToken } = theme

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' })

export default function ThankYou({ session, config, bill, onNewSession }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()
  const { token: { colorPrimary } } = useToken()

  const handleSubmitFeedback = async () => {
    if (rating === 0) { message.warning('Please select a rating'); return }
    setLoading(true)
    try {
      await api.post('/api/feedback', {
        sessionId: session?.id,
        hotelId: session?.hotelId,
        rating,
        comment,
        customerName: session?.customerName,
        tableNo: session?.tableNo,
      })
      setSubmitted(true)
      message.success('Thank you for your feedback! 🎉')
    } catch {
      message.error('Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)' }}>
      <Content style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-fadeInUp" style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
          {/* Success Animation */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: `linear-gradient(135deg, #22c55e, #16a34a)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 12px 40px rgba(34,197,94,0.4)',
            animation: 'pulse 2s infinite',
          }}>
            <span style={{ fontSize: 48 }}>✅</span>
          </div>

          <Title level={2} style={{ fontWeight: 800, marginBottom: 4 }}>{t('thankYou')}</Title>
          <Text style={{ fontSize: 16, color: '#666', display: 'block', marginBottom: 8 }}>
            {t('thankYouDining')}
          </Text>

          {bill && (
            <div style={{
              background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: '12px 24px',
              margin: '16px auto', display: 'inline-block',
              backdropFilter: 'blur(10px)', border: '1px solid rgba(34,197,94,0.2)',
            }}>
              <Text style={{ fontSize: 13, color: '#999' }}>{t('totalBill')}</Text>
              <Title level={3} style={{ color: '#22c55e', margin: '0', fontWeight: 800 }}>₹{bill.totalAmount}</Title>
            </div>
          )}

          {/* Feedback Section */}
          {!submitted ? (
            <div style={{
              background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 28,
              marginTop: 24, backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center',
            }}>
              <SmileOutlined style={{ fontSize: 28, color: colorPrimary, marginBottom: 8 }} />
              <Title level={4} style={{ margin: '0 0 16px', fontWeight: 700 }}>{t('rateExperience')}</Title>

              <Rate
                value={rating}
                onChange={setRating}
                style={{ fontSize: 36, marginBottom: 16 }}
                character={<StarOutlined />}
              />

              <TextArea
                rows={3}
                placeholder={t('feedbackPlaceholder')}
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{ borderRadius: 12, marginBottom: 16, resize: 'none' }}
              />

              <Button
                type="primary" block size="large" loading={loading}
                onClick={handleSubmitFeedback}
                disabled={rating === 0}
                style={{
                  height: 48, fontSize: 15, fontWeight: 600, borderRadius: 14,
                  background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
                  border: 'none', marginBottom: 8,
                }}>
                {t('submitFeedback')}
              </Button>

              <Button type="text" block onClick={onNewSession}
                style={{ color: '#999', fontSize: 13 }}>
                {t('skipFeedback')}
              </Button>
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎊</div>
              <Text style={{ fontSize: 15, color: '#666', display: 'block', marginBottom: 24 }}>
                Your feedback matters! Thank you ❤️
              </Text>
            </div>
          )}

          <Button
            type="primary" size="large" block
            onClick={onNewSession}
            style={{
              marginTop: submitted ? 0 : 16, height: 52, fontSize: 16, fontWeight: 700,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
            }}>
            🍽️ {t('newSession')}
          </Button>

          <div style={{ marginTop: 16 }}>
            <LangToggle style={{ background: 'rgba(0,0,0,0.06)', color: '#666', border: '1px solid rgba(0,0,0,0.1)' }} />
          </div>
        </div>
      </Content>
    </Layout>
  )
}
