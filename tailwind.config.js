/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'stx-dark': '#0f172a', // Background utama (Slate 900)
        'stx-card': '#1e293b', // Background kartu (Slate 800)
        'stx-accent': '#5546FF', // Warna ungu khas Stacks
        'stx-success': '#10b981',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
