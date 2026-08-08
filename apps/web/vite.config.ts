import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { convyxIcons } from './vite/icons-plugin';
import { convyxPdfjsAssets } from './vite/pdfjs-assets-plugin';
import { convyxHeaders } from './vite/headers-plugin';
import { convyxSiteUrl } from './vite/site-url-plugin';

export default defineConfig(({ mode }) => {
  // Where the site is published. The link-preview tags, the canonical link and
  // the sitemap all need it, and all three get this one answer. Set
  // VITE_SITE_URL in the host's build settings to publish anywhere else; the
  // default is Cloudflare Pages' own address, so a clone builds correctly with
  // no setup at all.
  const configured = loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL;
  const origin = (configured || 'https://convyx.pages.dev').replace(/\/+$/, '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      convyxIcons(),
      convyxPdfjsAssets(),
      convyxHeaders(),
      convyxSiteUrl(origin),
    ],
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
  };
});
