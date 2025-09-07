import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 11111,
    allowedHosts: [
      'keyguard.meetneura.ai',
      'meetneura.ai',
      'localhost'
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo: any) => {
          // Keep specific files in root
          if (assetInfo.name === 'sitemap.xml' || 
              assetInfo.name === 'robots.txt' || 
              assetInfo.name === 'manifest.json' ||
              assetInfo.name === 'humans.txt' ||
              assetInfo.name === 'security.txt') {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
