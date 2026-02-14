import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Memastikan polyfill global tersedia untuk library blockchain
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Alias untuk polyfills jika diperlukan
      buffer: 'buffer',
    },
  },
})
