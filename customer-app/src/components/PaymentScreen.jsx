import React, { useState } from 'react'
import { Layout, Typography, Card, Button, Space, App as AntApp, theme } from 'antd'
import {
  CheckCircleOutlined, DollarOutlined, ArrowLeftOutlined,
  CreditCardOutlined, SafetyOutlined
} from '@ant-design/icons'
import { createRazorpayOrder, verifyRazorpayPayment, initiatePayment } from '../api.js'
import { useI18n, LangToggle } from '../i18n/index.jsx'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { useToken } = theme

export default function PaymentScreen({ session, config, bill, onPaymentComplete, onBack }) {
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('UNPAID')
  const { token: { colorPrimary } } = useToken()
  const { t } = useI18n()
  const { message } = AntApp.useApp()

  const handleRazorpay = async () => {
    setLoading(true)
    try {
      const { data } = await createRazorpayOrder(bill.id)

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: config?.appName || 'Hotel Restaurant',
        description: `Bill for Table ${session.tableNo}`,
        handler: async function (response) {
          setPaymentStatus('PROCESSING')
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || data.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || '',
              billId: bill.id,
            })
            setPaymentStatus('SUCCESS')
            message.success('🎉 ' + t('paymentSuccess'))
            setTimeout(() => onPaymentComplete(), 2000)
          } catch {
            message.error('Payment verification failed. Please contact staff.')
            setPaymentStatus('UNPAID')
          }
        },
        prefill: { name: session.customerName, contact: session.phone || '' },
        theme: { color: colorPrimary },
        modal: {
          ondismiss: function () {
            setLoading(false)
            message.info(t('paymentCancelled'))
          }
        }
      }

      if (data.razorpayOrderId && !data.razorpayOrderId.startsWith('test_order')) {
        options.order_id = data.razorpayOrderId
      }

      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => { new window.Razorpay(options).open() }
        script.onerror = () => { message.error('Failed to load payment gateway.'); setLoading(false) }
        document.body.appendChild(script)
      } else {
        new window.Razorpay(options).open()
      }
    } catch (err) {
      message.error(err.response?.data?.error || err.response?.data?.message || t('failedPayment'))
    } finally {
      setLoading(false)
    }
  }

  const handleCash = async () => {
    setLoading(true)
    try {
      await initiatePayment({ paymentMethod: 'CASH' })
      setPaymentStatus('CASH_PENDING')
    } catch (err) {
      message.error(err.response?.data?.message || t('failedPayment'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Header style={{
        background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
        padding: '0 16px', display: 'flex', alignItems: 'center', height: 60, gap: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      }}>
        {/* Fix #9: Back button */}
        {onBack && paymentStatus === 'UNPAID' && (
          <Button icon={<ArrowLeftOutlined />} type="text" style={{ color: '#fff' }} onClick={onBack} />
        )}
        <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, flex: 1 }}>💳 {t('payment')}</Title>
        <LangToggle />
      </Header>

      <Content style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {paymentStatus === 'SUCCESS' ? (
          <div className="animate-fadeInUp" style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 12px 40px rgba(34,197,94,0.4)',
            }}>
              <CheckCircleOutlined style={{ fontSize: 42, color: '#fff' }} />
            </div>
            <Title level={3} style={{ marginTop: 16, fontWeight: 700 }}>{t('paymentSuccess')}</Title>
            <Text type="secondary" style={{ fontSize: 15 }}>{t('thankYouDining')} 🎉</Text>
          </div>
        ) : paymentStatus === 'CASH_PENDING' ? (
          <div className="animate-fadeInUp" style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: `0 8px 24px ${colorPrimary}40`,
            }}>
              <DollarOutlined style={{ fontSize: 38, color: '#fff' }} />
            </div>
            <Title level={3} style={{ fontWeight: 700 }}>{t('cashRequested')}</Title>
            <Text type="secondary" style={{ fontSize: 15, display: 'block', maxWidth: 360, margin: '8px auto' }}>
              {t('pleasePay')} <Text strong style={{ color: colorPrimary }}>₹{bill.totalAmount}</Text> {t('cashInstructions')}
            </Text>
          </div>
        ) : paymentStatus === 'PROCESSING' ? (
          <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: 60 }}>
            <div className="animate-pulse" style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <Title level={4}>{t('verifying')}</Title>
            <Text type="secondary">{t('dontClose')}</Text>
          </div>
        ) : (
          <div className="animate-fadeInUp" style={{ width: '100%', maxWidth: 420 }}>
            <Card className="glass-card" style={{ marginBottom: 20, textAlign: 'center' }}
              styles={{ body: { padding: '28px 24px' } }}>
              <Text style={{ fontSize: 13, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('totalBill')}
              </Text>
              <Title level={1} style={{
                color: colorPrimary, margin: '4px 0 8px', fontSize: 42, fontWeight: 800,
              }}>
                ₹{bill.totalAmount}
              </Title>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f5f5f5', padding: '4px 14px', borderRadius: 20,
              }}>
                <span>🪑</span>
                <Text style={{ fontSize: 13, color: '#666' }}>{t('table')} {session.tableNo}</Text>
              </div>
            </Card>

            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12, color: '#555' }}>
              {t('choosePayment')}
            </Text>

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Card hoverable className="glass-card" onClick={handleRazorpay}
                style={{ cursor: 'pointer' }} styles={{ body: { padding: '18px 20px' } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${colorPrimary}30`,
                  }}>
                    <CreditCardOutlined style={{ fontSize: 22, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 15 }}>{t('payOnline')}</Text><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('payOnlineDesc')}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: colorPrimary, fontSize: 16 }}>₹{bill.totalAmount}</Text><br />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <SafetyOutlined style={{ fontSize: 10, color: '#52c41a' }} />
                      <Text style={{ fontSize: 10, color: '#52c41a' }}>{t('secure')}</Text>
                    </div>
                  </div>
                </div>
              </Card>

              <Card hoverable className="glass-card" onClick={handleCash}
                style={{ cursor: 'pointer' }} styles={{ body: { padding: '18px 20px' } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DollarOutlined style={{ fontSize: 22, color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 15 }}>{t('payCash')}</Text><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('payCashDesc')}</Text>
                  </div>
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>₹{bill.totalAmount}</Text>
                </div>
              </Card>
            </Space>

            <Text style={{ display: 'block', textAlign: 'center', marginTop: 24, color: '#bbb', fontSize: 11 }}>
              🔒 {t('paymentSecure')}
            </Text>
          </div>
        )}
      </Content>
    </Layout>
  )
}
