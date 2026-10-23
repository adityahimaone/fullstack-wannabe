import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['sql.js/dist/sql-wasm.js'],
  },
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
