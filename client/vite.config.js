import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import react from "@vitejs/plugin-react";
export default defineConfig(() => {
  // Read only proxy settings. Loading the server's NODE_ENV into Vite would
  // accidentally produce a development React bundle during a production build.
  let env = {};
  try {
    env = parseEnv(readFileSync(new URL("../.env", import.meta.url), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const target =
    process.env.API_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    "http://127.0.0.1:" + (process.env.PORT || env.PORT || "3001");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: { "/api": target, "/ws": { target, ws: true } },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
      include: ["src/**/*.test.{js,jsx}"],
      restoreMocks: true,
    },
  };
});
