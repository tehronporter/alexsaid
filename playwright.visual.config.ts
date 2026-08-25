import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  workers: 1,
  reporter: "list",
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.03 } },
  use: { baseURL: "http://127.0.0.1:3000", timezoneId: "UTC" },
  projects: [
    { name: "iphone-se", use: { ...devices["iPhone SE"] } },
    { name: "modern-iphone", use: { ...devices["iPhone 14"] } },
    { name: "large-iphone", testMatch: "**/quote-polish.spec.ts", use: { ...devices["iPhone 15 Pro Max"] } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }
  ],
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
