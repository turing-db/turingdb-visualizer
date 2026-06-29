import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // Only the mocked UI specs. The API-contract suite under tests/integration
  // uses `*.test.ts` and is run by Vitest (`npm run test:api`), not Playwright.
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
})
