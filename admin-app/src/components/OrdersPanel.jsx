import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Typography, message, Select, Badge } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080' })

const STATUS_COLOR = {
  RECEIVED: 'blue', PREPARING: 'orange', READY: 'green', PAID: 'default'
}

export default function OrdersPanel({ hotelId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/api/orders/hotel/${hotelId}`)
      setOrders(r.data)
    } catch { message.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [hotelId])

  const updateStatus = async (orderRef, status, paidVia) => {
    await api.patch('/api/orders/status', { orderRef, status, paidVia })
    message.success(`Order ${orderRef} → ${status}`)
    load()
  }

  const columns = [
    { title: 'Ref', dataIndex: 'orderRef', render: v => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text> },
    { title: 'Table', dataIndex: 'tableNo', width: 70 },
    { title: 'Status', dataIndex: 'status', render: v => <Badge status={v === 'RECEIVED' ? 'processing' : v === 'PREPARING' ? 'warning' : v === 'READY' ? 'success' : 'default'} text={<Tag color={STATUS_COLOR[v]}>{v}</Tag>} /> },
    { title: 'Total', dataIndex: 'totalAmount', render: v => <Text strong style={{ color: '#fa541c' }}>${v}</Text>, width: 90 },
    { title: 'Paid Via', dataIndex: 'paidVia', render: v => v ? <Tag color="green">{v}</Tag> : <Tag>Unpaid</Tag>, width: 90 },
    { title: 'Time', dataIndex: 'createdAt', render: v => v ? new Date(v).toLocaleString() : '-' },
    {
      title: 'Actions', render: (_, r) => (
        <Space>
          {r.status === 'RECEIVED' && <Button size="small" onClick={() => updateStatus(r.orderRef, 'PREPARING')}>Prepare</Button>}
          {r.status === 'PREPARING' && <Button size="small" type="primary" onClick={() => updateStatus(r.orderRef, 'READY')}>Ready</Button>}
          {r.status !== 'PAID' && <Button size="small" danger onClick={() => updateStatus(r.orderRef, 'PAID', 'CASH')}>Mark Paid</Button>}
        </Space>
      )
    }
  ]

  return (
    <Card title="All Orders" extra={<Button icon={<SyncOutlined />} onClick={load} loading={loading}>Refresh</Button>}>
      <Table
        dataSource={orders} columns={columns} rowKey="id" size="small"
        expandable={{
          expandedRowRender: r => (
            <Table size="small" dataSource={r.items || []} pagination={false} rowKey="id"
              columns={[
                { title: 'Item', dataIndex: 'itemName' },
                { title: 'Qty', dataIndex: 'quantity', width: 60 },
                { title: 'Price', dataIndex: 'price', render: v => `$${v}`, width: 80 }
              ]} />
          )
        }}
      />
    </Card>
  )
}
