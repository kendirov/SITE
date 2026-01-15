import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/iss': {
        target: 'https://iss.moex.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
})


