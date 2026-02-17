import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
    // FIX: Paksa penggunaan satu instance library Stacks untuk mencegah error "Invalid Clarity Value"
    dedupe: [
      '@stacks/transactions',
      '@stacks/network',
      '@stacks/common',
      '@stacks/connect',
      '@stacks/auth'
    ],
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
})
