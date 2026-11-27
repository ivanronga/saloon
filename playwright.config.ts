import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  webServer: { command: "npm run seed && npm run dev", url: "http://localhost:3000/hr", reuseExistingServer: true, timeout: 120000 },
  use: {
    baseURL: "http://localhost:3000",
    // Optional: reuse a pre-installed Chromium (CI/cloud) instead of `npx playwright install`.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
});
