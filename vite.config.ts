import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

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
