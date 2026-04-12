import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Typography, Space, InputNumber, message, Tag, Alert } from 'antd'
import { QrcodeOutlined, PrinterOutlined, LinkOutlined, CheckCircleOutlined } from '@ant-design/icons'
import QRCode from 'react-qr-code'
import api from '../api.js'

const { Title, Text } = Typography

export default function QrGenerator({ hotelId }) {
  // Auto-detect: target customer-app port from current origin
  const [baseUrl, setBaseUrl] = useState(() => {
    const origin = window.location.origin
    if (origin.includes('devtunnels.ms') || origin.includes('ngrok') || origin.includes('herokuapp')) {
      return origin.replace(/:\d+$/, ':3000')
    }
    const hostname = window.location.hostname || 'localhost'
    return `http://${hostname}:3000`
  })

  const [tableCount, setTableCount] = useState(10)
  const [backendHealthy, setBackendHealthy] = useState(null)
  const printRef = useRef()

  // Health check
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin
    api.get('/api/config/1').then(() => setBackendHealthy(true)).catch(() => setBackendHealthy(false))
  }, [])

  const getQRValue = (tableNo) => `${baseUrl}?hotelId=${hotelId}&tableNo=${tableNo}`

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '', 'width=800,height=600')
    printWindow.document.write(`
      <html><head><title>QR Codes - Hotel ${hotelId}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; }
        .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .qr-card { text-align: center; border: 2px solid #eee; border-radius: 16px; padding: 20px; page-break-inside: avoid; }
        .qr-card h3 { margin: 12px 0 4px; font-size: 18px; }
        .qr-card p { margin: 0; color: #999; font-size: 12px; }
        @media print { .qr-card { border: 2px solid #ddd; } }
      </style></head><body>
      <h2 style="text-align:center">Hotel QR Codes</h2>
      ${content.innerHTML}
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16, marginBottom: 20 }}>
        <Title level={4}><QrcodeOutlined /> QR Code Generator</Title>

        {/* Backend health */}
        {backendHealthy !== null && (
          <Alert
            type={backendHealthy ? 'success' : 'warning'}
            message={backendHealthy ? '✅ Backend API is reachable' : '⚠️ Backend API is not reachable — QR codes may not work'}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              <LinkOutlined /> Customer App URL (auto-detected)
            </Text>
            <Input
              value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
              style={{ borderRadius: 10 }} size="large"
              addonAfter={
                <Tag color={backendHealthy ? 'green' : 'orange'} style={{ margin: 0 }}>
                  {backendHealthy ? 'Online' : 'Offline'}
                </Tag>
              }
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              This is auto-detected from your current URL. Change it if using a tunnel or custom domain.
            </Text>
          </div>

          <div>
            <Text strong style={{ fontSize: 13 }}>Number of Tables</Text>
            <InputNumber min={1} max={100} value={tableCount}
              onChange={setTableCount} style={{ width: '100%', borderRadius: 10, marginTop: 4 }} size="large" />
          </div>
        </Space>
      </Card>

      {/* QR Preview + Print */}
      <Card style={{ borderRadius: 16 }}
        extra={<Button icon={<PrinterOutlined />} type="primary" onClick={handlePrint}>Print All</Button>}>

        <div ref={printRef} className="qr-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {Array.from({ length: tableCount }, (_, i) => i + 1).map(tableNo => (
            <div key={tableNo} style={{
              textAlign: 'center', border: '1px solid #eee', borderRadius: 16,
              padding: 20, background: '#fafafa',
            }}>
              <QRCode value={getQRValue(tableNo)} size={140}
                style={{ margin: '0 auto', display: 'block' }} />
              <Title level={5} style={{ marginTop: 12, marginBottom: 2 }}>Table {tableNo}</Title>
              <Text type="secondary" style={{ fontSize: 10, wordBreak: 'break-all' }}>
                {getQRValue(tableNo)}
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
