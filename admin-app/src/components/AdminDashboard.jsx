import React, { useState } from 'react'
import { Layout, Menu, Typography, Button } from 'antd'
import { AppstoreOutlined, UnorderedListOutlined, ShoppingOutlined, DollarOutlined, LogoutOutlined, QrcodeOutlined } from '@ant-design/icons'
import MenuManagement from './MenuManagement.jsx'
import OrdersPanel from './OrdersPanel.jsx'
import OfflinePayment from './OfflinePayment.jsx'
import QrGenerator from './QrGenerator.jsx'

const { Sider, Content, Header } = Layout
const { Title, Text } = Typography

const MENU_ITEMS = [
  { key: 'menu',    icon: <AppstoreOutlined />,    label: 'Menu Management' },
  { key: 'orders',  icon: <ShoppingOutlined />,    label: 'Orders' },
  { key: 'offline', icon: <DollarOutlined />,      label: 'Offline Payment' },
  { key: 'qr',      icon: <QrcodeOutlined />,      label: 'QR Codes' },
]

export default function AdminDashboard({ adminData, onLogout }) {
  const [page, setPage] = useState('menu')
  const [collapsed, setCollapsed] = useState(false)

  const renderPage = () => {
    switch (page) {
      case 'menu':    return <MenuManagement hotelId={adminData.hotelId} />
      case 'orders':  return <OrdersPanel hotelId={adminData.hotelId} />
      case 'offline': return <OfflinePayment />
      case 'qr':      return <QrGenerator hotelId={adminData.hotelId} />
      default: return null
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}
        style={{ background: '#001529' }} width={220}>
        <div style={{ padding: collapsed ? '16px 8px' : '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }}>
          {!collapsed && <Text strong style={{ color: '#fff', fontSize: 14 }}>{adminData.hotelName}</Text>}
        </div>
        <Menu theme="dark" selectedKeys={[page]} mode="inline"
          items={MENU_ITEMS} onClick={({ key }) => setPage(key)} />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
          <Button icon={<LogoutOutlined />} block danger ghost onClick={onLogout}
            style={{ fontSize: 13 }}>
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <Title level={4} style={{ margin: 0 }}>
            {MENU_ITEMS.find(m => m.key === page)?.label}
          </Title>
          <Text type="secondary">Logged in as <strong>{adminData.username}</strong></Text>
        </Header>
        <Content style={{ margin: 24, background: '#f5f5f5', minHeight: '100%' }}>
          {renderPage()}
        </Content>
      </Layout>
    </Layout>
  )
}
