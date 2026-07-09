import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local development, calls to /api are forwarded to the Express server
// on port 4000. In production the Express server serves this built app, so
// /api is already the same origin and no proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
  },
});
