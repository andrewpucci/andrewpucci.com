# End-to-End (E2E) Testing

This directory contains Playwright end-to-end tests for the Andrew Pucci portfolio website. These tests ensure that critical user flows and content are functioning as expected.

## Test Structure

```
tests/e2e/
├── home.spec.js           # Tests for the home page
├── resume.spec.js         # Tests for the resume page
└── portfolio/            # Tests for portfolio project pages
    └── redesigning-telerik-analytics.spec.js  # Tests for Telerik Analytics project page
```

## Running Tests

### Prerequisites

- Node.js 24.x or higher
- npm 8+
- Playwright browsers installed (`npx playwright install`)

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run a specific test file
npm run test:e2e tests/e2e/resume.spec.js

# Run tests in UI mode (for debugging)
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## Test Strategy

### Home Page Tests (`home.spec.js`)

- Verifies the home page loads correctly
- Checks for essential sections (header, hero, about, etc.)
- Validates navigation links

### Resume Page Tests (`resume.spec.js`)

- Validates resume sections (Experience, Education, etc.)
- Checks for downloadable resume link
- Verifies contact information

### Portfolio Project Tests (`portfolio/*.spec.js`)

- Validates project-specific content
- Checks for project metadata (team, tools, responsibilities)
- Verifies images and media content
- Ensures consistent structure across project pages

## Best Practices

### Writing Tests

1. **Be Resilient**:
   - Use semantic selectors (prefer `getByRole` and `getByText` over CSS selectors)
   - Avoid testing implementation details
   - Make tests independent and isolated

2. **Documentation**:
   - Use descriptive test names
   - Add JSDoc comments for test suites and helper functions
   - Include comments explaining complex test logic

3. **Maintainability**:
   - Keep tests DRY (Don't Repeat Yourself)
   - Use page objects for complex pages
   - Group related tests with `test.describe`

### Debugging Tests

- Use `test.only` to run a single test
- Add `await page.pause()` to pause test execution
- Use `--debug` flag for step-by-step debugging
- Check the HTML report for detailed failure information

## Common Issues

### Flaky Tests

If a test is flaky (sometimes passes, sometimes fails):

1. Check for elements that might load asynchronously
2. Add proper waiting mechanisms (`waitForSelector`, `waitForLoadState`)
3. Make selectors more specific to avoid false positives

### Test Failures

When a test fails:

1. Check the error message and stack trace
2. Look at the failure screenshot in the HTML report
3. Verify if the UI has changed and the test needs updating

## CI/CD Integration

This project uses GitHub Actions for continuous integration. The CI pipeline is configured to:

- Run on all pull requests targeting the `main` branch
- Run on all direct pushes to the `main` branch
- Execute both unit tests and end-to-end tests
- Cache dependencies for faster builds
- Generate and upload test reports as artifacts

The workflow will automatically fail if any tests fail, helping to prevent deployment of broken code.

### Viewing Test Results

1. **GitHub Actions UI**: Go to the "Actions" tab in the GitHub repository to see the status of recent workflow runs.
2. **Test Artifacts**: Download the `playwright-report` artifact from a completed workflow run to view detailed test results and screenshots.
3. **Local Testing**: To run the same tests locally, use:

   ```bash
   # Run all tests
   npm run test:ci

   # Run only unit tests
   npm test

   # Run only E2E tests
   npm run test:e2e
   ```

## Playwright Configuration

The Playwright configuration is in `playwright.config.js`:

### Key Settings

- **Test Directory**: `./tests/e2e`
- **Base URL**: `http://localhost:8080` (configurable via `TEST_BASE_URL` env var)
- **Browsers**: Chromium, Firefox, and WebKit (all desktop configurations)
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 worker in CI (sequential), parallel locally
- **Web Server**: Automatically starts dev server on port 8080
- **Screenshots**: Captured only on failure
- **Traces**: Captured on first retry

### Environment Variables

```bash
# Override the base URL for tests
export TEST_BASE_URL=http://localhost:3000

# Enable debug mode
export PWDEBUG=1
```

## Test File Structure

Each test file follows this structure:

```javascript
// @ts-check
/**
 * @file Description of what this test file covers
 * @description Detailed explanation of test organization
 * @module tests/e2e/[filename]
 */

import { test, expect } from '@playwright/test';

/**
 * Test suite description
 * @description Groups related tests
 */
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code that runs before each test
    await page.goto('/path');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test description
   * @description What this test verifies
   */
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Selector Best Practices

### Recommended Selectors (in order of preference)

1. **User-facing attributes**

   ```javascript
   page.getByRole('button', { name: 'Submit' });
   page.getByText('Welcome');
   page.getByLabel('Email');
   page.getByPlaceholder('Enter email');
   ```

2. **Test IDs** (when semantic selectors aren't available)

   ```javascript
   page.getByTestId('submit-button');
   ```

3. **CSS Selectors** (as a last resort)
   ```javascript
   page.locator('.specific-class');
   page.locator('#unique-id');
   ```

### Avoid

- XPath selectors (brittle and hard to read)
- Overly specific CSS selectors (`.parent > .child > .grandchild`)
- Selectors based on implementation details

## Common Test Patterns

### Navigation and Page Load

```javascript
test('should navigate to page', async ({ page }) => {
  await page.goto('/about');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/About/);
});
```

### Form Interactions

```javascript
test('should submit form', async ({ page }) => {
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Checking Visibility

```javascript
test('should show element', async ({ page }) => {
  const element = page.getByRole('heading', { name: 'Title' });
  await expect(element).toBeVisible();
});
```

### Waiting for Elements

```javascript
test('should wait for dynamic content', async ({ page }) => {
  // Wait for specific element
  await page.waitForSelector('.dynamic-content');

  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for specific condition
  await page.waitForFunction(() => document.querySelectorAll('.item').length > 5);
});
```

### Testing Links

```javascript
test('should have correct link', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Portfolio' });
  await expect(link).toHaveAttribute('href', '/portfolio/');
});
```

### Testing Images

```javascript
test('should display image with alt text', async ({ page }) => {
  const image = page.getByAltText('Project screenshot');
  await expect(image).toBeVisible();

  const src = await image.getAttribute('src');
  expect(src).toBeTruthy();
});
```

### Testing Responsive Behavior

```javascript
test('should adapt to mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  const mobileMenu = page.getByRole('button', { name: 'Menu' });
  await expect(mobileMenu).toBeVisible();
});
```

## Handling Flaky Tests

### Use Proper Waits

```javascript
// Bad: Arbitrary timeout
await page.waitForTimeout(1000);

// Good: Wait for specific condition
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

### Use Auto-waiting

Playwright automatically waits for elements to be actionable:

```javascript
// These automatically wait for the element to be ready
await page.click('button');
await page.fill('input', 'text');
```

### Retry Assertions

```javascript
// Playwright retries assertions automatically
await expect(page.getByText('Loading...')).not.toBeVisible();
await expect(page.getByText('Content loaded')).toBeVisible();
```

## Accessibility Testing

### Check for Alt Text

```javascript
test('images should have alt text', async ({ page }) => {
  const images = page.locator('img:visible');
  const count = await images.count();

  for (let i = 0; i < count; i++) {
    const alt = await images.nth(i).getAttribute('alt');
    expect(alt).toBeTruthy();
  }
});
```

### Check for ARIA Labels

```javascript
test('interactive elements should have labels', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Submit' });
  await expect(button).toBeVisible();
});
```

### Keyboard Navigation

```javascript
test('should be keyboard navigable', async ({ page }) => {
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement.tagName);
  expect(focused).toBe('A'); // First link should be focused
});
```

## Performance Testing

```javascript
test('should load quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
});
```

## Debugging Failed Tests

### View Test Report

```bash
npm run test:e2e:report
```

The HTML report includes:

- Test results and timing
- Screenshots of failures
- Traces for debugging
- Error messages and stack traces

### Run in Debug Mode

```bash
npm run test:e2e:debug
```

This opens Playwright Inspector for step-by-step debugging.

### Run in UI Mode

```bash
npm run test:e2e:ui
```

This provides an interactive UI for running and debugging tests.

### Add Debug Statements

```javascript
test('debug test', async ({ page }) => {
  await page.goto('/');

  // Pause execution
  await page.pause();

  // Take screenshot
  await page.screenshot({ path: 'debug.png' });

  // Log page content
  const content = await page.content();
  console.log(content);
});
```

## Test Organization Tips

### Group Related Tests

```javascript
test.describe('Navigation', () => {
  test.describe('Desktop', () => {
    test('should show full menu', async ({ page }) => {...});
  });

  test.describe('Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should show hamburger menu', async ({ page }) => {...});
  });
});
```

### Use Fixtures for Common Setup

```javascript
test.beforeEach(async ({ page }) => {
  // Common setup for all tests in this describe block
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});
```

### Skip Tests Conditionally

```javascript
test('desktop only feature', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Not supported on Safari');
  // Test implementation
});
```

## CI/CD Integration Details

### GitHub Actions Workflow

The CI pipeline (`.github/workflows/ci.yml`) runs E2E tests with:

- **Retries**: 2 automatic retries on failure
- **Parallel Execution**: Disabled in CI (1 worker) for stability
- **Browser Installation**: Automatic via `playwright install --with-deps`
- **Artifacts**: Test reports uploaded for 7 days

### Viewing CI Test Results

1. Go to the **Actions** tab in GitHub
2. Click on the workflow run
3. Check the "Run E2E tests" step for results
4. Download the `playwright-report` artifact for detailed results

### Local CI Simulation

To run tests exactly as CI does:

```bash
CI=true npm run test:e2e -- --retries=2 --workers=1
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Web.dev Testing Guide](https://web.dev/learn/testing/)
