import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Upload, Row, Col } from 'antd';
import { UploadOutlined, BgColorsOutlined } from '@ant-design/icons';
import api from '../api.js';


export default function BrandingSettings({ hotelId }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadedLogo, setUploadedLogo] = useState(null);

    useEffect(() => {
        api.get(`/api/config/${hotelId}`)
           .then(r => form.setFieldsValue(r.data))
           .catch(() => message.error("Failed to load branding info"))
           .finally(() => setLoading(false));
    }, [hotelId]);

    const onFinish = async (values) => {
        setSaving(true);
        const data = { ...values, logoUrl: uploadedLogo || values.logoUrl };
        try {
            await api.put(`/api/admin/config/${hotelId}`, data);
            message.success("Branding updated successfully!");
        } catch (e) {
            message.error("Failed to save branding settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card title="Branding Settings" loading={loading} style={{ maxWidth: 800, margin: '0 auto' }}>
             <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item name="appName" label="App Name">
                    <Input placeholder="E.g. Hotel Zero Menu" />
                </Form.Item>
                <Form.Item name="logoUrl" label="Logo URL">
                    <Input placeholder="https://..." />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="primaryColor" label="Primary Color (Hex)">
                            <Input prefix={<BgColorsOutlined />} placeholder="#fa541c" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="secondaryColor" label="Secondary Color (Hex)">
                            <Input prefix={<BgColorsOutlined />} placeholder="#ff7a45" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="fontFamily" label="Font Family">
                    <Input placeholder="Inter, sans-serif" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>Save Settings</Button>
             </Form>
        </Card>
    );
}
