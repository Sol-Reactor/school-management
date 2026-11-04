import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api is proxied to the local backend so the session cookie is
// same-origin — exactly like production, where Vercel rewrites /api to Render.
export default defineConfig({
  plugins: [react()],
  server: {
    // 5173 (Vite's default) — port 3000 is often inside Windows' Hyper-V excluded range.
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
