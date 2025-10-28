import { defineConfig, type UserConfigExport } from "vite";
import react from "@vitejs/plugin-react";

const config: UserConfigExport = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: (process.env.VITE_API_URL ?? "").replace("/api", "") || "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});

export default config;
