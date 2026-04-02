import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true   // bind to 0.0.0.0 — accessible on local network
  },
  optimizeDeps: {
    include: ['@stomp/stompjs', 'axios', 'antd', '@ant-design/icons']
  }
})
