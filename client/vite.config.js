import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8080";
const allowedHosts = (
  process.env.VITE_ALLOWED_HOSTS || "localhost,127.0.0.1,finance.falveshub.com"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
