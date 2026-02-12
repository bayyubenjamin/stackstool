import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mapping agar library 'buffer' terbaca benar
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util'
    },
  },
  define: {
    // Polyfill untuk variable global yang dibutuhkan Stacks.js
    'global': 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      // Penting untuk library crypto/web3
      define: {
        global: 'globalThis',
      },
    },
  },
})
