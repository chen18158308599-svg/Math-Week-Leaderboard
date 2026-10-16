import { build } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
await build({
  configFile: false,
  root: fileURLToPath(new URL("../digital-games/", import.meta.url)),
  base: "/digital-play/",
  plugins: [react()],
  build: { outDir: fileURLToPath(new URL("../public/digital-play/", import.meta.url)), emptyOutDir: true },
});
