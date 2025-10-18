// @ts-check
/**
 * @file Playwright configuration
 * @description Configuration for Playwright end-to-end testing framework.
 * Defines test settings, browser configurations, and web server setup.
 * @see {@link https://playwright.dev/docs/test-configuration|Playwright Configuration}
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory containing test files
  testDir: './tests/e2e',
  
  // Run tests in parallel for faster execution
  fullyParallel: true,
  
  // Fail CI if test.only() is accidentally left in code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests in CI to handle flakiness
  retries: process.env.CI ? 2 : 0,
  
  // Use single worker in CI for stability, parallel locally for speed
  workers: process.env.CI ? 1 : undefined,
  
  // Generate HTML report for test results
  reporter: 'html',
  use: {
    // Base URL for all page.goto() calls
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:8080',
    
    // Capture trace on first retry for debugging
    trace: 'on-first-retry',
    
    // Take screenshots only when tests fail
    screenshot: 'only-on-failure',
  },
  // Test across multiple browsers for compatibility
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Automatically start dev server before running tests
  webServer: {
    // Command to start the development server
    command: 'npm run serve',
    
    // URL to wait for before running tests
    url: 'http://localhost:8080',
    
    // Reuse existing server locally, start fresh in CI
    reuseExistingServer: !process.env.CI,
    
    // Ignore stdout to reduce noise
    stdout: 'ignore',
    
    // Pipe stderr for error visibility
    stderr: 'pipe',
  },
});
