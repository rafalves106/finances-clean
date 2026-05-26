import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
import packageJson from "./package.json" with { type: "json" };

const { version } = packageJson;

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8080";
const allowedHosts = (
  process.env.VITE_ALLOWED_HOSTS || "localhost,127.0.0.1,finance.falveshub.com"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    coverage: {
      provider: "v8",
      include: ["src/util/**", "src/services/**"],
      thresholds: {
        statements: 100,
        lines: 100,
        functions: 100,
        branches: 80,
      },
    },
  },
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
