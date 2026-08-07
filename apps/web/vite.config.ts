import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { convyxIcons } from './vite/icons-plugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), convyxIcons()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Tool bundles are code-split by the registry's lazy imports; keeping the
    // warning low makes an accidentally eager import obvious.
    chunkSizeWarningLimit: 700,
  },
});
