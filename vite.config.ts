import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 11111,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
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
