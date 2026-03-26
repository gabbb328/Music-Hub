// vite.config.ts
import { defineConfig } from "file:///C:/Users/194246/Desktop/harmony-hub-84/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/194246/Desktop/harmony-hub-84/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/194246/Desktop/harmony-hub-84/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/194246/Desktop/harmony-hub-84/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\194246\\Desktop\\harmony-hub-84";
var vite_config_default = defineConfig(({ mode }) => ({
  base: mode === "production" ? "./" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    },
    allowedHosts: ["intercausative-soo-edgingly.ngrok-free.dev"],
    proxy: {
      "/api/acoustid": {
        target: "https://api.acoustid.org",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/acoustid/, ""),
        secure: true
      },
      "/api/audd": {
        target: "https://api.audd.io",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/audd/, ""),
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Harmony Hub",
        short_name: "Harmony",
        description: "Your Harmony Hub Application",
        theme_color: "#ffffff",
        icons: [
          {
            src: "icons/app_blu_scuro.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/app_blu_scuro.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          framer: ["framer-motion"],
          query: ["@tanstack/react-query"]
        }
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFwxOTQyNDZcXFxcRGVza3RvcFxcXFxoYXJtb255LWh1Yi04NFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcMTk0MjQ2XFxcXERlc2t0b3BcXFxcaGFybW9ueS1odWItODRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzLzE5NDI0Ni9EZXNrdG9wL2hhcm1vbnktaHViLTg0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgYmFzZTogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBcIi4vXCIgOiBcIi9cIixcblxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxuICAgIH0sXG4gICAgYWxsb3dlZEhvc3RzOiBbXCJpbnRlcmNhdXNhdGl2ZS1zb28tZWRnaW5nbHkubmdyb2stZnJlZS5kZXZcIl0sXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaS9hY291c3RpZFwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwczovL2FwaS5hY291c3RpZC5vcmdcIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvYWNvdXN0aWQvLCBcIlwiKSxcbiAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIFwiL2FwaS9hdWRkXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vYXBpLmF1ZGQuaW9cIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvYXVkZC8sIFwiXCIpLFxuICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XG4gICAgICAgICAgcHJveHkub24oXCJwcm94eVJlcVwiLCAocHJveHlSZXEpID0+IHtcbiAgICAgICAgICAgIHByb3h5UmVxLnJlbW92ZUhlYWRlcihcIm9yaWdpblwiKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcblxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAnbWFzay1pY29uLnN2ZyddLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogJ0hhcm1vbnkgSHViJyxcbiAgICAgICAgc2hvcnRfbmFtZTogJ0hhcm1vbnknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1lvdXIgSGFybW9ueSBIdWIgQXBwbGljYXRpb24nLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2ljb25zL2FwcF9ibHVfc2N1cm8ucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaWNvbnMvYXBwX2JsdV9zY3Vyby5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9KVxuICBdLmZpbHRlcihCb29sZWFuKSxcblxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG5cbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IFwiZGlzdFwiLFxuICAgIGFzc2V0c0RpcjogXCJhc3NldHNcIixcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIGZyYW1lcjogWydmcmFtZXItbW90aW9uJ10sXG4gICAgICAgICAgcXVlcnk6IFsnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J10sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFMsU0FBUyxvQkFBb0I7QUFDM1UsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxNQUFNLFNBQVMsZUFBZSxPQUFPO0FBQUEsRUFFckMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLGNBQWMsQ0FBQyw0Q0FBNEM7QUFBQSxJQUMzRCxPQUFPO0FBQUEsTUFDTCxpQkFBaUI7QUFBQSxRQUNmLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLG9CQUFvQixFQUFFO0FBQUEsUUFDdEQsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLGFBQWE7QUFBQSxRQUNYLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLGdCQUFnQixFQUFFO0FBQUEsUUFDbEQsUUFBUTtBQUFBLFFBQ1IsV0FBVyxDQUFDLFVBQVU7QUFDcEIsZ0JBQU0sR0FBRyxZQUFZLENBQUMsYUFBYTtBQUNqQyxxQkFBUyxhQUFhLFFBQVE7QUFBQSxVQUNoQyxDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGVBQWU7QUFBQSxNQUN0RSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixPQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBRWhCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUVBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixRQUFRLENBQUMsZUFBZTtBQUFBLFVBQ3hCLE9BQU8sQ0FBQyx1QkFBdUI7QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
