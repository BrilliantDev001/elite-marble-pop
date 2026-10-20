import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// react() enables JSX and fast refresh.
// tailwindcss() enables Tailwind v4, so no tailwind.config file is needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
