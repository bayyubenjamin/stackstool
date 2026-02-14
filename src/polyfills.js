import { Buffer } from 'buffer';

// Wajib untuk Stacks.js di Vite
window.global = window;
window.Buffer = Buffer;
window.process = { env: { NODE_ENV: 'development' } };
