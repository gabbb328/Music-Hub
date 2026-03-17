import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "./" : "/",

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: ["intercausative-soo-edgingly.ngrok-free.dev"],
    proxy: {
      "/api/acoustid": {
        target: "https://api.acoustid.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/acoustid/, ""),
        secure: true,
      },
      "/api/audd": {
        target: "https://api.audd.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/audd/, ""),
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Harmony Hub',
        short_name: 'Harmony',
        description: 'Your Harmony Hub Application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/app_blu_scuro.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/app_blu_scuro.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          framer: ['framer-motion'],
          query: ['@tanstack/react-query'],
        }
      }
    }
  }
}));
