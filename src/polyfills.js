import { Buffer } from 'buffer';

// Wajib untuk Stacks.js di Vite agar tidak error "Buffer is not defined"
window.global = window;
window.Buffer = Buffer;
window.process = { env: { NODE_ENV: 'development' } };
