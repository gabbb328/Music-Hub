import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: "/",

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
      "/api/alexa": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: "Harmony Hub",
        short_name: "Harmony",
        description: "Stream, discover, and enjoy your favorite music with AI-powered recommendations",
        theme_color: "#0a0e27",
        background_color: "#0a0e27",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icons/app_blu_scuro.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/app_blu_scuro.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "Playlists",
            url: "/playlists",
            description: "View your playlists"
          },
          {
            name: "Search",
            url: "/search",
            description: "Search for music"
          }
        ],
        // @ts-ignore - widgets index is not yet standard in VitePWA types but works in browser
        widgets: [
          {
            name: "Player 2x2",
            description: "Music Player Widget 2x2",
            tag: "player_2x2",
            template: "widget_player_2x2",
            ms_ac_template: "widget_player_2x2",
            data: "widget-player-data",
            type: "widget",
            screenshot: "/icons/app_blu_scuro.png"
          },
          {
            name: "Player 4x2",
            description: "Music Player Widget 4x2",
            tag: "player_4x2",
            template: "widget_player_4x2",
            ms_ac_template: "widget_player_4x2",
            data: "widget-player-data",
            type: "widget",
            screenshot: "/icons/app_blu_scuro.png"
          },
          {
            name: "Vinyl 2x2",
            description: "Vinyl Player Widget 2x2",
            tag: "vinyl_2x2",
            template: "widget_vinyl_2x2",
            ms_ac_template: "widget_vinyl_2x2",
            data: "widget-vinyl-data",
            type: "widget",
            screenshot: "/icons/app_blu_scuro.png"
          }
        ]
      },
    }),
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
          vendor: ["react", "react-dom"],
          framer: ["framer-motion"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
}));
