import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    // CORS bypass proxies for MOEX APIs
    proxy: {
      // Authorized AlgoPack API (with auth token)
      '/moex-api': {
        target: 'https://apim.moex.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/moex-api/, ''),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward Authorization header from client
            const authHeader = req.headers.authorization
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader)
            }
            
            proxyReq.setHeader('Accept', 'application/json')
            console.log('[Vite Proxy] Routing to apim.moex.com (AlgoPack API)')
          })
        },
      },
      
      // Free public API (without auth token)
      '/api/moex': {
        target: 'https://iss.moex.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moex/, ''),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Accept', 'application/json')
            console.log('[Vite Proxy] Routing to iss.moex.com (free API)')
          })
        },
      },
    },
  },
  build: {
    // For production, API calls should go through backend
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query', 'axios'],
        },
      },
    },
  },
})
