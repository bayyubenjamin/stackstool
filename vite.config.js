import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mengarahkan import 'buffer' ke library buffer yang sudah diinstall
      buffer: 'buffer',
    },
  },
  define: {
    // Definisi global untuk library legacy
    'global': 'window',
  },
})
