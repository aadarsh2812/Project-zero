import React, { useState, useEffect } from 'react'
import { Card, List, Rate, Typography, Space, Statistic, Tag, Empty, Spin, Row, Col } from 'antd'
import { StarOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Title, Text, Paragraph } = Typography

export default function FeedbackPanel({ hotelId }) {
  const [feedback, setFeedback] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/feedback/hotel/${hotelId}`),
      api.get(`/api/feedback/hotel/${hotelId}/summary`),
    ]).then(([fbRes, sumRes]) => {
      setFeedback(fbRes.data)
      setSummary(sumRes.data)
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [hotelId])

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }} />

  return (
    <div>
      {/* Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <StarOutlined style={{ fontSize: 28, color: '#faad14', marginBottom: 8 }} />
            <Statistic
              title="Average Rating"
              value={summary?.averageRating || 0}
              suffix="/ 5"
              valueStyle={{ color: '#faad14', fontWeight: 800 }}
            />
            <Rate disabled value={summary?.averageRating || 0} allowHalf style={{ marginTop: 8 }} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card style={{ borderRadius: 16, textAlign: 'center' }}>
            <MessageOutlined style={{ fontSize: 28, color: '#667eea', marginBottom: 8 }} />
            <Statistic
              title="Total Reviews"
              value={summary?.totalReviews || 0}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Feedback List */}
      <Card title={<Text strong>Recent Feedback</Text>} style={{ borderRadius: 16 }}>
        {feedback.length === 0 ? (
          <Empty description="No feedback yet" />
        ) : (
          <List
            dataSource={feedback}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UserOutlined style={{ color: '#fff', fontSize: 18 }} />
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong>{item.customerName || 'Guest'}</Text>
                      <Tag>🪑 Table {item.tableNo || '-'}</Tag>
                      <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                    </Space>
                  }
                  description={
                    <div>
                      {item.comment && <Paragraph style={{ margin: '4px 0' }}>{item.comment}</Paragraph>}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
