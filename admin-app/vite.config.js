import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3002 },
  optimizeDeps: {
    include: ['axios', 'antd', '@ant-design/icons']
  }
})
