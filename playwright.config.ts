import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
process.env.REVIEWER_PASSWORD ??= randomBytes(24).toString("hex");
process.env.SESSION_SECRET ??= randomBytes(32).toString("hex");
process.env.APP_ORIGIN = "http://localhost:3001";
process.env.DATABASE_PATH ??= `.data/e2e-${Date.now()}`;
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  webServer: {
    command: "npm run start -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
