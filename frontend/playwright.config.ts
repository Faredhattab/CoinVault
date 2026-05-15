import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:3000"
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], viewport: { width: 360, height: 800 } }
    }
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true
  }
});
