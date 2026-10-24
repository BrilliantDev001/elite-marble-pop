import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Anything the browser requests under /api is forwarded to the Express server.
// The browser only ever talks to this one address, so there are no cross-origin (CORS) problems
// and the admin login cookie works as a normal same-site cookie.
// "preview" is the same setting for "npm run preview" (the production build, tested locally).
const apiProxy = {
  "/api": { target: "http://localhost:5000" },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
});
