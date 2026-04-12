import React, { useState, useEffect, useRef } from 'react'
import {
  Layout, Typography, Card, Row, Col, Button, Badge, Drawer, List,
  Space, message, Spin, Empty, Divider, theme
} from 'antd'
import {
  ShoppingCartOutlined, MinusOutlined, PlusOutlined,
  DeleteOutlined, CheckOutlined, ArrowRightOutlined
} from '@ant-design/icons'
import { getMenu, placeOrder } from '../api.js'
import { useI18n, LangToggle } from '../i18n/index.jsx'
const { useToken } = theme;

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function MenuPage({ session, config, cart, setCart, onViewOrders }) {
  const [menu, setMenu]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeCategory, setActiveCat] = useState(null)
  const [drawerOpen, setDrawer]   = useState(false)
  const [ordering, setOrdering]   = useState(false)
  const categoryRefs              = useRef({})
  const catScrollRef              = useRef(null)
  const { token: { colorPrimary } } = useToken();
  const { t } = useI18n()

  useEffect(() => {
    const cached = sessionStorage.getItem(`menu_${session.hotelId}`)
    if (cached) {
      const data = JSON.parse(cached)
      setMenu(data)
      if (data.length) setActiveCat(data[0].id)
      setLoading(false)
    }
    getMenu(session.hotelId).then(r => {
      setMenu(r.data)
      if (r.data.length && !cached) setActiveCat(r.data[0].id)
      sessionStorage.setItem(`menu_${session.hotelId}`, JSON.stringify(r.data))
      setLoading(false)
    }).catch(() => { if (!cached) message.error('Failed to load menu'); setLoading(false) })
  }, [])

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const addToCart = (item) => {
    setCart(prev => {
      const found = prev.find(c => c.menuItemId === item.id)
      if (found) return prev.map(c => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  const changeQty = (menuItemId, qty) => {
    if (qty < 1) return setCart(p => p.filter(c => c.menuItemId !== menuItemId))
    setCart(p => p.map(c => c.menuItemId === menuItemId ? { ...c, qty } : c))
  }

  const handleOrder = async () => {
    if (!cart.length) return
    setOrdering(true)
    try {
      await placeOrder({
        hotelId: session.hotelId,
        tableNo: session.tableNo,
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.qty }))
      })
      setCart([])
      setDrawer(false)
      message.success({ content: `✅ ${t('orderPlaced')}`, duration: 4 })
      onViewOrders()
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Spin size="large" />
      <Text style={{ color: '#999' }}>Loading delicious menu...</Text>
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      {/* Header */}
      <Header style={{
        background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
        padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, height: 60,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      }}>
        <div>
          <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
            {config?.appName || session.hotelName || 'Menu'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
            🪑 Table {session.tableNo} • {session.customerName}
          </Text>
        </div>
        <Space size={8}>
          <Button type="text" style={{ color: '#fff', fontWeight: 500, fontSize: 13 }} onClick={onViewOrders}>
            My Orders <ArrowRightOutlined />
          </Button>
          <Badge count={cartCount} offset={[-2, 2]} color={colorPrimary}>
            <Button shape="circle" icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />}
              onClick={() => setDrawer(true)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 38, height: 38 }} />
          </Badge>
        </Space>
      </Header>

      {/* Category Chips */}
      <div ref={catScrollRef} style={{
        background: '#fff', padding: '10px 16px', overflowX: 'auto', whiteSpace: 'nowrap',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)', position: 'sticky', top: 60, zIndex: 99,
        display: 'flex', gap: 6, scrollbarWidth: 'none',
      }}>
        {menu.map(cat => (
          <button key={cat.id}
            className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
            style={activeCategory === cat.id ? { background: colorPrimary } : {}}
            onClick={() => {
              setActiveCat(cat.id)
              categoryRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <Content style={{ padding: 16 }}>
        {menu.map((cat, catIdx) => (
          <div key={cat.id} ref={el => categoryRefs.current[cat.id] = el}
            className="animate-fadeInUp" style={{ marginBottom: 28, animationDelay: `${catIdx * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 4, height: 22, borderRadius: 2,
                background: `linear-gradient(180deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
              }} />
              <Title level={5} style={{ margin: 0, fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
                {cat.name}
              </Title>
              <Text style={{ color: '#bbb', fontSize: 12 }}>{cat.items.length} items</Text>
            </div>
            <Row gutter={[12, 12]}>
              {cat.items.map((item, idx) => {
                const cartItem = cart.find(c => c.menuItemId === item.id)
                return (
                  <Col xs={24} sm={12} md={8} key={item.id}>
                    <Card className="food-card" hoverable
                      style={{
                        border: cartItem ? `2px solid ${colorPrimary}` : undefined,
                        position: 'relative',
                      }}
                      styles={{ body: { padding: 12 } }}
                      cover={
                        <div style={{ overflow: 'hidden', height: 150 }}>
                          <img src={item.imageUrl} alt={item.name}
                            style={{ width: '100%', height: 150, objectFit: 'cover' }}
                            onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} />
                          {cartItem && (
                            <div className="added-badge">✓ In Cart</div>
                          )}
                        </div>
                      }>
                      <Text strong style={{ display: 'block', marginBottom: 2, fontSize: 14 }}>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 10, lineHeight: '1.4' }}>
                        {item.description}
                      </Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: colorPrimary, fontSize: 17, fontWeight: 700 }}>₹{item.price}</Text>
                        {cartItem ? (
                          <Space size={4}>
                            <Button size="small" shape="circle" icon={<MinusOutlined />}
                              onClick={() => changeQty(item.id, cartItem.qty - 1)}
                              style={{ width: 28, height: 28, fontSize: 12 }} />
                            <Text strong style={{ minWidth: 20, textAlign: 'center', fontSize: 14 }}>{cartItem.qty}</Text>
                            <Button size="small" shape="circle" icon={<PlusOutlined />}
                              style={{ background: colorPrimary, border: 'none', color: '#fff', width: 28, height: 28 }}
                              onClick={() => changeQty(item.id, cartItem.qty + 1)} />
                          </Space>
                        ) : (
                          <Button size="small" onClick={() => addToCart(item)}
                            style={{
                              background: `${colorPrimary}10`, color: colorPrimary,
                              border: `1px solid ${colorPrimary}30`, borderRadius: 8,
                              fontWeight: 600, fontSize: 12,
                            }}>
                            + ADD
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        ))}
        {!menu.length && <Empty description="Menu not available" style={{ marginTop: 64 }} />}
        <div style={{ height: 90 }} />
      </Content>

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="cart-bar">
          <Button type="primary" block size="large" onClick={() => setDrawer(true)}
            className="btn-primary"
            style={{
              background: `linear-gradient(135deg, ${colorPrimary}, ${config?.secondaryColor || '#ff8f66'})`,
              fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <ShoppingCartOutlined /> View Cart ({cartCount} items) — ₹{cartTotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <Drawer
        title={<Text strong style={{ fontSize: 18 }}>🛒 Your Cart</Text>}
        placement="bottom" height="70vh" open={drawerOpen} onClose={() => setDrawer(false)}
        styles={{ body: { padding: '12px 20px' } }}
        extra={
          <Button type="primary" loading={ordering} icon={<CheckOutlined />}
            className="btn-primary" onClick={handleOrder}
            disabled={!cart.length} style={{ borderRadius: 20 }}>
            Place Order
          </Button>
        }>
        {!cart.length ? <Empty description="Your cart is empty" /> : (
          <>
            <List dataSource={cart} renderItem={item => (
              <List.Item
                style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                actions={[
                  <Button danger size="small" icon={<DeleteOutlined />}
                    onClick={() => setCart(p => p.filter(c => c.menuItemId !== item.menuItemId))}
                    style={{ borderRadius: 8 }} />
                ]}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <Text strong style={{ fontSize: 14 }}>{item.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>₹{item.price} × {item.qty}</Text>
                </div>
                <Space size={6}>
                  <Button size="small" shape="circle" icon={<MinusOutlined />}
                    onClick={() => changeQty(item.menuItemId, item.qty - 1)} />
                  <Text strong>{item.qty}</Text>
                  <Button size="small" shape="circle" icon={<PlusOutlined />}
                    onClick={() => changeQty(item.menuItemId, item.qty + 1)} />
                </Space>
              </List.Item>
            )} />
            <Divider style={{ margin: '16px 0' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: `${colorPrimary}08`, borderRadius: 12,
            }}>
              <Text strong style={{ fontSize: 18 }}>Total</Text>
              <Text strong style={{ fontSize: 22, color: colorPrimary }}>₹{cartTotal.toFixed(2)}</Text>
            </div>
          </>
        )}
      </Drawer>
    </Layout>
  )
}
