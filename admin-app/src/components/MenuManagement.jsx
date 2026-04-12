import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Typography, Popconfirm, message, Tag, Image, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '../api.js'

const { Text } = Typography

export default function MenuManagement({ hotelId }) {
  const [categories, setCategories] = useState([])
  const [items, setItems]           = useState([])
  const [catModal, setCatModal]     = useState(false)
  const [itemModal, setItemModal]   = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [catForm] = Form.useForm()
  const [itemForm] = Form.useForm()

  const load = async () => {
    const [catRes, itemRes] = await Promise.all([
      api.get(`/api/admin/${hotelId}/categories`),
      api.get(`/api/admin/${hotelId}/items`)
    ])
    setCategories(catRes.data)
    setItems(itemRes.data)
  }

  useEffect(() => { load() }, [hotelId])

  const addCategory = async (values) => {
    await api.post(`/api/admin/${hotelId}/categories`, values)
    message.success('Category added')
    setCatModal(false); catForm.resetFields(); load()
  }

  const deleteCategory = async (id) => {
    await api.delete(`/api/admin/${hotelId}/categories/${id}`)
    message.success('Category deleted'); load()
  }

  const openItemModal = (item = null) => {
    setEditingItem(item)
    if (item) itemForm.setFieldsValue({ ...item, available: item.available })
    else itemForm.resetFields()
    setItemModal(true)
  }

  const saveItem = async (values) => {
    setLoading(true)
    try {
      if (editingItem) {
        await api.put(`/api/admin/${hotelId}/items/${editingItem.id}`, values)
        message.success('Item updated')
      } else {
        await api.post(`/api/admin/${hotelId}/items`, values)
        message.success('Item added')
      }
      setItemModal(false); load()
    } catch { message.error('Failed to save item') }
    finally { setLoading(false) }
  }

  const deleteItem = async (id) => {
    await api.delete(`/api/admin/${hotelId}/items/${id}`)
    message.success('Item deleted'); load()
  }

  const catColumns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Order', dataIndex: 'displayOrder', width: 80 },
    { title: 'Items', width: 80, render: (_, r) => items.filter(i => i.categoryId === r.id).length },
    {
      title: 'Action', width: 80, render: (_, r) => (
        <Popconfirm title="Delete category?" onConfirm={() => deleteCategory(r.id)}>
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ]

  const itemColumns = [
    { title: 'Image', width: 70, render: (_, r) => <Image src={r.imageUrl} width={50} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} fallback="https://placehold.co/50x40" /> },
    { title: 'Name', dataIndex: 'name', render: (v, r) => <><Text strong>{v}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text></> },
    { title: 'Category', render: (_, r) => { const c = categories.find(c => c.id === r.categoryId); return c ? <Tag>{c.name}</Tag> : '-' } },
    { title: 'Price', dataIndex: 'price', render: v => <Text strong style={{ color: '#fa541c' }}>₹{v}</Text>, width: 80 },
    { title: 'Available', dataIndex: 'available', render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag>, width: 90 },
    {
      title: 'Actions', width: 100, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openItemModal(r)} />
          <Popconfirm title="Delete item?" onConfirm={() => deleteItem(r.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <Tabs items={[
        {
          key: 'items', label: 'Menu Items',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openItemModal()}>Add Item</Button>}>
              <Table dataSource={items} columns={itemColumns} rowKey="id" size="small" />
            </Card>
          )
        },
        {
          key: 'cats', label: 'Categories',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCatModal(true)}>Add Category</Button>}>
              <Table dataSource={categories} columns={catColumns} rowKey="id" size="small" />
            </Card>
          )
        }
      ]} />

      {/* Category Modal */}
      <Modal title="Add Category" open={catModal} onCancel={() => setCatModal(false)} footer={null}>
        <Form form={catForm} layout="vertical" onFinish={addCategory}>
          <Form.Item name="name" label="Category Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Add</Button>
        </Form>
      </Modal>

      {/* Item Modal */}
      <Modal title={editingItem ? 'Edit Item' : 'Add Menu Item'} open={itemModal}
        onCancel={() => setItemModal(false)} footer={null} width={520}>
        <Form form={itemForm} layout="vertical" onFinish={saveItem} initialValues={{ available: true }}>
          <Form.Item name="name" label="Item Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="price" label="Price (INR)" rules={[{ required: true }]}>
            <InputNumber prefix="₹" min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
            <Select options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="available" label="Available" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {editingItem ? 'Update' : 'Add Item'}
          </Button>
        </Form>
      </Modal>
    </>
  )
}
