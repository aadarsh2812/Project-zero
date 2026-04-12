import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Input, Space, message, Tabs, Popconfirm, Typography, Empty } from 'antd'
import { SearchOutlined, DeleteOutlined, ReloadOutlined, ClearOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Text } = Typography

export default function OrdersPanel({ hotelId }) {
  const [activeOrders, setActiveOrders] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchRef, setSearchRef] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  const fetchActive = () => {
    setLoading(true)
    api.get(`/api/orders/hotel/${hotelId}/active`)
      .then(r => setActiveOrders(r.data))
      .catch(() => message.error('Failed to load active orders'))
      .finally(() => setLoading(false))
  }

  const fetchCompleted = () => {
    api.get(`/api/orders/hotel/${hotelId}/completed`)
      .then(r => setCompletedOrders(r.data))
      .catch(() => {})
  }

  useEffect(() => { fetchActive(); fetchCompleted() }, [hotelId])

  const handleSearch = () => {
    if (!searchRef.trim()) { message.warning('Enter an order reference'); return }
    api.get(`/api/orders/ref/${searchRef.trim()}`)
      .then(r => setSearchResult(r.data))
      .catch(() => { setSearchResult(null); message.error('Order not found') })
  }

  const handleDelete = (orderId) => {
    api.delete(`/api/orders/${orderId}`)
      .then(() => { message.success('Order deleted'); fetchCompleted() })
      .catch(e => message.error(e.response?.data?.message || 'Failed to delete'))
  }

  const handleBulkDelete = () => {
    api.delete(`/api/orders/hotel/${hotelId}/completed`)
      .then(r => { message.success(r.data.message); fetchCompleted() })
      .catch(() => message.error('Failed to delete'))
  }

  const statusColor = (s) => {
    switch(s) {
      case 'RECEIVED': return 'blue'
      case 'PREPARING': return 'orange'
      case 'READY': return 'green'
      case 'PAID': return 'default'
      default: return 'default'
    }
  }

  const columns = [
    { title: 'Order Ref', dataIndex: 'orderRef', key: 'orderRef',
      render: v => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text> },
    { title: 'Table', dataIndex: 'tableNo', key: 'tableNo', render: v => `🪑 ${v}` },
    { title: 'Items', key: 'items', render: (_, r) =>
      (r.items || []).map((i,idx) => <div key={idx}>{i.quantity}× {i.itemName}</div>) },
    { title: 'Total', dataIndex: 'totalAmount', key: 'total', render: v => `₹${v}` },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: v => <Tag color={statusColor(v)}>{v}</Tag> },
    { title: 'Time', dataIndex: 'createdAt', key: 'time',
      render: v => v ? new Date(v).toLocaleTimeString() : '-' },
  ]

  const completedColumns = [
    ...columns,
    { title: 'Action', key: 'action', render: (_, r) => (
      <Popconfirm title="Delete this order?" onConfirm={() => handleDelete(r.id)}>
        <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
      </Popconfirm>
    )}
  ]

  return (
    <div>
      {/* Search by order ref */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space>
          <Input placeholder="Search by Order Ref (e.g. ORD-A1B2C3)"
            value={searchRef} onChange={e => setSearchRef(e.target.value)}
            onPressEnter={handleSearch} style={{ width: 300, borderRadius: 8 }}
            prefix={<SearchOutlined />} />
          <Button type="primary" onClick={handleSearch}>Search</Button>
          {searchResult && <Button onClick={() => setSearchResult(null)}>Clear</Button>}
        </Space>
        {searchResult && (
          <Card size="small" style={{ marginTop: 12, borderRadius: 10, background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Text strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{searchResult.orderRef}</Text>
                <br /><Text type="secondary">Table {searchResult.tableNo} • ₹{searchResult.totalAmount}</Text>
              </div>
              <Tag color={statusColor(searchResult.status)} style={{ height: 'fit-content', fontSize: 14, padding: '4px 12px' }}>
                {searchResult.status}
              </Tag>
            </div>
            <div style={{ marginTop: 8 }}>
              {(searchResult.items || []).map((i, idx) => (
                <Text key={idx} style={{ display: 'block', fontSize: 13 }}>{i.quantity}× {i.itemName} — ₹{i.price}</Text>
              ))}
            </div>
          </Card>
        )}
      </Card>

      <Tabs defaultActiveKey="active" items={[
        {
          key: 'active',
          label: `Active Orders (${activeOrders.length})`,
          children: (
            <Card style={{ borderRadius: 12 }} extra={
              <Button icon={<ReloadOutlined />} onClick={fetchActive}>Refresh</Button>
            }>
              <Table dataSource={activeOrders} columns={columns}
                rowKey="id" pagination={false} size="small"
                locale={{ emptyText: <Empty description="No active orders" /> }} />
            </Card>
          )
        },
        {
          key: 'completed',
          label: `History (${completedOrders.length})`,
          children: (
            <Card style={{ borderRadius: 12 }} extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchCompleted}>Refresh</Button>
                {completedOrders.length > 0 && (
                  <Popconfirm title={`Delete all ${completedOrders.length} completed orders?`} onConfirm={handleBulkDelete}>
                    <Button danger icon={<ClearOutlined />}>Delete All Completed</Button>
                  </Popconfirm>
                )}
              </Space>
            }>
              <Table dataSource={completedOrders} columns={completedColumns}
                rowKey="id" pagination={{ pageSize: 10 }} size="small"
                locale={{ emptyText: <Empty description="No completed orders" /> }} />
            </Card>
          )
        }
      ]} />
    </div>
  )
}
