import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // In local dev, forward /api to the Node answer service (npm run server).
  server: { port: 5174, host: true, proxy: { '/api': 'http://localhost:8090' } },
  preview: { port: 4174, host: true },
});
