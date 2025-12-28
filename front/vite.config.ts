import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 8080에서 8000으로 수정
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // 필요시 주석 해제
      },
    },
  },
})