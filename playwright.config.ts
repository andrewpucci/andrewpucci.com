import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // Tests run against the actual Cloudflare Pages build output (adapter's
    // prerendering, _headers, _redirects, and the one live Worker route), not
    // the Vite dev or preview server, so what's tested is what ships.
    // `vp preview` is a plain Node preview: it serves none of `_headers`,
    // does not apply `_redirects`, and leaves `platform` undefined.
    // Routed through `npm run` rather than bare `vp ...`: Playwright spawns
    // webServer via /bin/sh without node_modules/.bin on PATH, so a bare `vp`
    // exits 127 for anyone without the CLI installed globally. The scripts
    // themselves are still the Vite+ surface (`build` -> `vp build`).
    command: 'npm run build && npm run preview:pages',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
