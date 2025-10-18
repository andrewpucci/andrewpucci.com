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
- Node.js 16+
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

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
