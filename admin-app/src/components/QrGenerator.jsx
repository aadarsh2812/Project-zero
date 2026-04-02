import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Input, Button, Typography, Space, message, InputNumber, Divider, Tag } from 'antd'
import { QrcodeOutlined, CopyOutlined, PrinterOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

function QrCode({ url, tableNo }) {
  const encodedUrl = encodeURIComponent(url)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`
  return (
    <Card style={{ textAlign: 'center', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
      <img src={qrUrl} alt={`QR Table ${tableNo}`} style={{ width: 160, height: 160, borderRadius: 8 }} />
      <div style={{ marginTop: 8 }}>
        <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>Table {tableNo}</Tag>
      </div>
      <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, wordBreak: 'break-all' }}>{url}</Text>
    </Card>
  )
}

export default function QrGenerator({ hotelId }) {
  const [tableCount, setTableCount] = useState(10)
  const [baseUrl, setBaseUrl] = useState('http://10.0.2.24:3000')

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1)

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => message.success('URL copied!'))
  }

  const printAll = () => window.print()

  return (
    <div>
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space wrap>
          <div>
            <Text strong>Base URL: </Text>
            <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
              style={{ width: 220 }} placeholder="http://localhost:3000" />
          </div>
          <div>
            <Text strong>Number of Tables: </Text>
            <InputNumber min={1} max={50} value={tableCount}
              onChange={v => setTableCount(v)} />
          </div>
          <Button icon={<PrinterOutlined />} onClick={printAll}>Print All QR Codes</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {tables.map(t => {
          const url = `${baseUrl}?hotelId=${hotelId}&tableNo=${t}`
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={t}>
              <QrCode url={url} tableNo={t} />
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
