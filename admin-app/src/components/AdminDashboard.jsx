import React, { useState } from 'react'
import { Layout, Menu, Typography, Button, theme } from 'antd'
import {
  DashboardOutlined, ShoppingOutlined, AppstoreOutlined,
  DollarOutlined, QrcodeOutlined, BgColorsOutlined,
  BarChartOutlined, CreditCardOutlined, MessageOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import MenuManagement from './MenuManagement.jsx'
import OrdersPanel from './OrdersPanel.jsx'
import PaymentDashboard from './PaymentDashboard.jsx'
import QrGenerator from './QrGenerator.jsx'
import BrandingSettings from './BrandingSettings.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import RazorpaySettings from './RazorpaySettings.jsx'
import FeedbackPanel from './FeedbackPanel.jsx'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const MENU_ITEMS = [
  { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders' },
  { key: 'menu', icon: <AppstoreOutlined />, label: 'Menu' },
  { key: 'payment', icon: <DollarOutlined />, label: 'Cash Verify' },
  { key: 'razorpay', icon: <CreditCardOutlined />, label: 'Payment Config' },
  { key: 'qr', icon: <QrcodeOutlined />, label: 'QR Codes' },
  { key: 'branding', icon: <BgColorsOutlined />, label: 'Branding' },
  { key: 'feedback', icon: <MessageOutlined />, label: 'Feedback' },
]

export default function AdminDashboard({ hotelId, hotelName, onLogout }) {
  const [activeKey, setActiveKey] = useState('analytics')
  const [collapsed, setCollapsed] = useState(false)

  const renderContent = () => {
    switch (activeKey) {
      case 'analytics': return <AnalyticsDashboard hotelId={hotelId} />
      case 'orders': return <OrdersPanel hotelId={hotelId} />
      case 'menu': return <MenuManagement hotelId={hotelId} />
      case 'payment': return <PaymentDashboard hotelId={hotelId} />
      case 'razorpay': return <RazorpaySettings hotelId={hotelId} />
      case 'qr': return <QrGenerator hotelId={hotelId} />
      case 'branding': return <BrandingSettings hotelId={hotelId} />
      case 'feedback': return <FeedbackPanel hotelId={hotelId} />
      default: return <AnalyticsDashboard hotelId={hotelId} />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        style={{ background: 'linear-gradient(180deg, #1a0533, #2d1b69)' }}
        theme="dark"
      >
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          {!collapsed && (
            <>
              <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>🏨</Title>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{hotelName || 'Admin'}</Text>
            </>
          )}
          {collapsed && <Text style={{ color: '#fff', fontSize: 20 }}>🏨</Text>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={({ key }) => setActiveKey(key)}
          items={MENU_ITEMS}
          style={{ background: 'transparent', borderRight: 'none' }}
        />
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '0 16px' }}>
          <Button
            danger ghost block
            icon={<LogoutOutlined />}
            onClick={onLogout}
            style={{ borderRadius: 8 }}
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {MENU_ITEMS.find(m => m.key === activeKey)?.label || 'Dashboard'}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hotel ID: {hotelId}
          </Text>
        </Header>

        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: 360 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}
