import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Project Pages: https://seogyeongjeong.github.io/beneath-cot-live/
export default defineConfig({
  base: "/beneath-cot-live/",
  plugins: [react()],
  test: { environment: "node" },
});
