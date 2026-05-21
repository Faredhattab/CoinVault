import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Exclude Playwright tests and Next.js build files
    exclude: ["**/node_modules/**", "**/tests/**", "**/.next/**"],
    // Only run unit tests in src/
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "tests/**",
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js}",
        "**/types/**",
        "src/lib/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
