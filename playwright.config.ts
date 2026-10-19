import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
process.env.ADMIN_EMAIL = "admin@bhumi.test";
process.env.ADMIN_PASSWORD ??= randomBytes(24).toString("hex");
process.env.APP_ORIGIN = "http://localhost:3001";
process.env.BHUMI_TEST_PATH ??= `.data/e2e-${Date.now()}`;
process.env.DATABASE_PATH = process.env.BHUMI_TEST_PATH;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "";
process.env.RENDER = "";
process.env.SEED_DEMO = "true";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  webServer: {
    command: "npm run start -- --port 3001",
    url: "http://localhost:3001/api/health",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
