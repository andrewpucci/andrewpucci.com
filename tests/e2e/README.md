# End-to-End (E2E) Testing

This directory contains Playwright end-to-end tests for the Andrew Pucci portfolio site. These tests cover critical user flows and rendering in the built SvelteKit app.

## Test Structure

```text
tests/e2e/
├── home.spec.js           # Tests for the home page
├── resume.spec.js         # Tests for the resume page
├── contact.spec.js        # Tests for the contact form
├── a11y.spec.js           # axe-core (ADR-0002) + usability hygiene (ADR-0001) across every route
└── portfolio/            # Tests for portfolio project pages
    └── redesigning-telerik-analytics.spec.js  # Tests for Telerik Analytics project page
```

## Running Tests

### Prerequisites

- Node.js 24.x or higher
- Vite+ installed globally as `vp`
- Playwright browsers installed (`npx playwright install`)

Playwright builds the app and serves `.svelte-kit/cloudflare` with Wrangler via
`npm run build && npm run preview:pages`. This is the Cloudflare Pages runtime,
not the plain `vp preview` server. Copy `.dev.vars.example` to `.dev.vars` only
when a local run must exercise the live contact form.

### Commands

```bash
# Run all E2E tests
vp run test:e2e

# Run a specific test file
vp run test:e2e tests/e2e/resume.spec.js

# Run tests in UI mode (for debugging)
vp run test:e2e:ui

# Generate test report
vp run test:e2e:report
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

## CI/CD Integration

This project uses GitHub Actions for continuous integration. The CI pipeline is configured to:

- Run on all pull requests targeting `main`
- Run on all direct pushes to `main`
- Execute Vitest, Playwright, Lighthouse, and Storybook checks
- Cache dependencies for faster builds
- Generate and upload test reports as artifacts

### Viewing Test Results

To run the same checks locally, use:

```bash
# Run all tests
vp run test:ci

# Run static checks
vp check

# Run only unit/story tests
vp test

# Run only E2E tests
vp run test:e2e
```

## Playwright Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Test Directory**: `./tests/e2e`
- **Base URL**: `http://localhost:4173` (configurable via `TEST_BASE_URL`)
- **Browsers**: Chromium, Firefox, and WebKit
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI, parallel locally
- **Web Server**: Runs `npm run build && npm run preview:pages`
- **Screenshots**: Captured only on failure
- **Traces**: Captured on first retry
