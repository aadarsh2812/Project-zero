import React, { useState, useEffect, useRef } from 'react'
import {
  Layout, Typography, Card, Row, Col, Button, Badge, Drawer, List,
  InputNumber, Space, Tag, Affix, message, Spin, Empty, Avatar, Divider
} from 'antd'
import { ShoppingCartOutlined, MinusOutlined, PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { getMenu, placeOrder } from '../api.js'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function MenuPage({ session, cart, setCart, onViewOrders }) {
  const [menu, setMenu]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeCategory, setActiveCat] = useState(null)
  const [drawerOpen, setDrawer]   = useState(false)
  const [ordering, setOrdering]   = useState(false)
  const categoryRefs              = useRef({})

  useEffect(() => {
    const cached = sessionStorage.getItem(`menu_${session.hotelId}`)
    if (cached) {
      const data = JSON.parse(cached)
      setMenu(data)
      if (data.length) setActiveCat(data[0].id)
      setLoading(false)
      return
    }
    getMenu(session.hotelId).then(r => {
      setMenu(r.data)
      if (r.data.length) setActiveCat(r.data[0].id)
      sessionStorage.setItem(`menu_${session.hotelId}`, JSON.stringify(r.data))
      setLoading(false)
    }).catch(() => { message.error('Failed to load menu'); setLoading(false) })
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
        customerToken: session.token,
        hotelId: session.hotelId,
        tableNo: session.tableNo,
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.qty }))
      })
      setCart([])
      setDrawer(false)
      message.success({ content: 'Order placed! Kitchen is preparing your food.', duration: 4 })
      onViewOrders()
    } catch {
      message.error('Failed to place order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header style={{ background: 'linear-gradient(135deg, #fa541c, #ff7a45)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>{session.hotelName}</Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Table {session.tableNo} • {session.customerName}</Text>
        </div>
        <Space>
          <Button type="text" style={{ color: '#fff' }} onClick={onViewOrders}>My Orders</Button>
          <Badge count={cartCount} offset={[-2, 2]}>
            <Button shape="circle" icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
              onClick={() => setDrawer(true)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }} />
          </Badge>
        </Space>
      </Header>

      {/* Category tabs */}
      <div style={{ background: '#fff', padding: '0 16px', overflowX: 'auto', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 64, zIndex: 99 }}>
        {menu.map(cat => (
          <Button key={cat.id} type={activeCategory === cat.id ? 'primary' : 'text'}
            style={{ margin: '8px 4px', borderRadius: 20, ...(activeCategory === cat.id ? { background: '#fa541c', border: 'none' } : {}) }}
            onClick={() => {
              setActiveCat(cat.id)
              categoryRefs.current[cat.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Menu items */}
      <Content style={{ padding: 16 }}>
        {menu.map(cat => (
          <div key={cat.id} ref={el => categoryRefs.current[cat.id] = el} style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 12, color: '#fa541c' }}>{cat.name}</Title>
            <Row gutter={[12, 12]}>
              {cat.items.map(item => {
                const cartItem = cart.find(c => c.menuItemId === item.id)
                return (
                  <Col xs={24} sm={12} md={8} key={item.id}>
                    <Card
                      hoverable bodyStyle={{ padding: 12 }}
                      style={{ borderRadius: 12, overflow: 'hidden', border: cartItem ? '2px solid #fa541c' : '1px solid #f0f0f0' }}
                      cover={<img src={item.imageUrl} alt={item.name} style={{ height: 160, objectFit: 'cover' }}
                        onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} />}
                    >
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{item.description}</Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: '#fa541c', fontSize: 16 }}>${item.price}</Text>
                        {cartItem ? (
                          <Space>
                            <Button size="small" shape="circle" icon={<MinusOutlined />}
                              onClick={() => changeQty(item.id, cartItem.qty - 1)} />
                            <Text strong>{cartItem.qty}</Text>
                            <Button size="small" shape="circle" icon={<PlusOutlined />}
                              style={{ background: '#fa541c', border: 'none', color: '#fff' }}
                              onClick={() => changeQty(item.id, cartItem.qty + 1)} />
                          </Space>
                        ) : (
                          <Button type="primary" size="small" style={{ background: '#fa541c', border: 'none', borderRadius: 8 }}
                            onClick={() => addToCart(item)}>Add</Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        ))}
        {!menu.length && <Empty description="Menu not available" />}
        <div style={{ height: 80 }} />
      </Content>

      {/* Sticky bottom cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 200 }}>
          <Button type="primary" block size="large" onClick={() => setDrawer(true)}
            style={{ height: 56, borderRadius: 28, background: 'linear-gradient(135deg, #fa541c, #ff7a45)', border: 'none', fontSize: 16, boxShadow: '0 8px 24px rgba(250,84,28,0.4)' }}>
            <ShoppingCartOutlined /> View Cart ({cartCount} items) — ${cartTotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <Drawer title="Your Cart" placement="bottom" height={500} open={drawerOpen} onClose={() => setDrawer(false)}
        extra={<Button type="primary" loading={ordering} icon={<CheckOutlined />}
          style={{ background: '#fa541c', border: 'none' }} onClick={handleOrder}
          disabled={!cart.length}>Place Order</Button>}>
        {!cart.length ? <Empty description="Your cart is empty" /> : (
          <>
            <List dataSource={cart} renderItem={item => (
              <List.Item actions={[
                <Button danger size="small" icon={<DeleteOutlined />}
                  onClick={() => setCart(p => p.filter(c => c.menuItemId !== item.menuItemId))} />
              ]}>
                <List.Item.Meta title={item.name} description={`$${item.price} × ${item.qty}`} />
                <Space>
                  <Button size="small" icon={<MinusOutlined />} onClick={() => changeQty(item.menuItemId, item.qty - 1)} />
                  <Text strong>{item.qty}</Text>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => changeQty(item.menuItemId, item.qty + 1)} />
                </Space>
              </List.Item>
            )} />
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 18 }}>Total</Text>
              <Text strong style={{ fontSize: 18, color: '#fa541c' }}>${cartTotal.toFixed(2)}</Text>
            </div>
          </>
        )}
      </Drawer>
    </Layout>
  )
}
