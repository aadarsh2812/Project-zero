import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Spin, Rate, Tag } from 'antd'
import {
  DollarOutlined, ShoppingOutlined, TeamOutlined, StarOutlined,
  RiseOutlined, FireOutlined
} from '@ant-design/icons'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api.js'

const { Title, Text } = Typography

export default function AnalyticsDashboard({ hotelId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/admin/${hotelId}/analytics`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [hotelId])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (!data) return <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">No data available</Text></div>

  const revenueChartData = data.revenueByDay ? Object.entries(data.revenueByDay).map(([date, rev]) => ({
    date: date.substring(5), // MM-DD
    revenue: Number(rev),
  })) : []

  const topItemsData = data.topItems ? Object.entries(data.topItems).map(([name, qty]) => ({
    name: name.length > 12 ? name.substring(0, 12) + '...' : name,
    quantity: qty,
  })) : []

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card style={{ borderRadius: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}>
            <DollarOutlined style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }} />
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>TOTAL REVENUE</Text>
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>₹{Number(data.totalRevenue).toLocaleString()}</Title>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderRadius: 16, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}>
            <ShoppingOutlined style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }} />
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>TODAY'S ORDERS</Text>
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>{data.todayOrders}</Title>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderRadius: 16, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}>
            <RiseOutlined style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }} />
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>AVG ORDER VALUE</Text>
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>₹{Number(data.avgOrderValue).toFixed(0)}</Title>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderRadius: 16, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}>
            <TeamOutlined style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }} />
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>ACTIVE SESSIONS</Text>
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>{data.activeSessions}</Title>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Second row: Today Revenue + Feedback */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: '20px 24px' } }}>
            <Text type="secondary" style={{ fontSize: 12 }}>TODAY'S REVENUE</Text>
            <Title level={3} style={{ margin: '4px 0', fontWeight: 800, color: '#52c41a' }}>₹{Number(data.todayRevenue).toLocaleString()}</Title>
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: '20px 24px' } }}>
            <Text type="secondary" style={{ fontSize: 12 }}>TOTAL ORDERS</Text>
            <Title level={3} style={{ margin: '4px 0', fontWeight: 800 }}>{data.totalOrders}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>CUSTOMER RATING</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#faad14' }}>{data.avgRating}</Title>
                  <Rate disabled value={data.avgRating} allowHalf style={{ fontSize: 14 }} />
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>{data.feedbackCount} reviews</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title={<Text strong>Revenue (Last 7 Days)</Text>} style={{ borderRadius: 16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" style={{ fontSize: 11 }} />
                <YAxis style={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} dot={{ fill: '#667eea', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title={<Text strong>🔥 Top Items</Text>} style={{ borderRadius: 16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topItemsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" style={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#f5576c" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Order Status Breakdown */}
      <Card title={<Text strong>Order Status Breakdown</Text>} style={{ borderRadius: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {data.ordersByStatus && Object.entries(data.ordersByStatus).map(([status, count]) => (
            <Tag key={status} color={status === 'PAID' ? 'green' : status === 'READY' ? 'green' : status === 'PREPARING' ? 'orange' : 'blue'}
              style={{ fontSize: 14, padding: '6px 16px', borderRadius: 12 }}>
              {status}: {count}
            </Tag>
          ))}
        </div>
      </Card>
    </div>
  )
}
