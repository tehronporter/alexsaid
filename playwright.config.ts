import { defineConfig, devices } from "@playwright/test";

const useProductionServer = Boolean(process.env.CI || process.env.E2E_PRODUCTION);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 2,
  timeout: 60_000,
  // Local runs boot `next dev`, so the first hit on each route waits on a Turbopack
  // cold compile while two workers race for it. CI builds first and serves with
  // `npm start`, where this does not happen. One retry keeps local runs honest
  // without turning compile latency into a red suite.
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } }
  ],
  webServer: {
    command: useProductionServer ? "npm start" : "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
