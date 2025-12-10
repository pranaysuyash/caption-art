import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression testing
 * Tests layout at multiple viewport sizes and states
 */
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.visual.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Start both backend and frontend dev servers for visual tests so that
    // login API requests used by the visual tests work without needing a
    // separate manual dev server. We use a shell command to start the
    // backend dev server (npm --prefix ../backend run dev) in the
    // background and then start the frontend dev server (npm run dev).
    // This keeps the test setup self-contained for developers running the
    // Playwright suite locally and in CI.
    command: 'sh -c "npm --prefix ../backend run dev & npm run dev"',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
