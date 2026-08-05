/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';
import { createArgosReporterOptions } from '@argos-ci/playwright/reporter';
import { env } from 'node:process';

const shouldUploadArgos = env.ARGOS_UPLOAD === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!env.CI,
  retries: env.CI ? 2 : 0,
  workers: env.CI ? 1 : undefined,
  reporter: [
    [env.CI ? 'dot' : 'list'],
    [
      '@argos-ci/playwright/reporter',
      createArgosReporterOptions({ uploadToArgos: shouldUploadArgos }),
    ],
    ['html', { outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: env.TEST_BASE_URL || 'http://localhost:4173',
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
    reuseExistingServer: !env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
