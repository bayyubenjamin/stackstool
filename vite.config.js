import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Polyfill untuk Buffer yang dibutuhkan Stacks.js
      buffer: 'buffer',
    },
  },
  define: {
    // Polyfill global untuk browser
    'global': 'window',
    'process.env': {},
  },
})
