import { defineConfig } from "@playwright/test";

// Fully isolated from `npm run dev`: own port, own PGlite folder, own Next build folder.
const PORT = 3100;
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 }, // first request to each route compiles it in dev
  webServer: {
    command: `npm run seed && npm run create-admin && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/hr`,
    reuseExistingServer: false,
    timeout: 180000,
    env: {
      PGLITE_DIR: ".data/e2e",
      NEXT_DIST_DIR: ".next-e2e",
      ADMIN_EMAIL: "e2e-admin@example.com",
      ADMIN_PASSWORD: "e2e-password-12345",
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    actionTimeout: 10000,
    // Optional: reuse a pre-installed Chromium (CI/cloud) instead of `npx playwright install`.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
});
