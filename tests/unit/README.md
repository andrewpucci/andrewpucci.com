# Unit Tests

This directory contains unit tests for the Eleventy build process and custom filters/shortcodes.

## Test Structure

```
tests/unit/
├── async-shortcodes.test.js  # Tests for async shortcodes
├── filters.test.js          # Tests for custom Eleventy filters
├── image.test.js            # Tests for image processing
├── min-html.test.js         # Tests for HTML minification
├── min-js.test.js           # Tests for JavaScript minification
├── minify.test.js           # Core minification tests
└── site-data.test.js        # Tests for site data processing
```

## Running Tests

```bash
# Run all unit tests
npm test

# Run a specific test file
npx vitest run tests/unit/filters.test.js

# Run in watch mode
touch tests/unit/filters.test.js && npx vitest
```

## Test Conventions

- Test files are colocated with the code they test (when possible)
- Test filenames match the pattern `*.test.js`
- Each test file has a descriptive name indicating what it tests
- Tests are written using Vitest's API (similar to Jest)

## Writing New Tests

1. Create a new test file following the naming convention
2. Import the functions you want to test
3. Write test cases using `test()` or `it()`
4. Use `expect()` for assertions
5. Add descriptive test names that explain the expected behavior

## Debugging Tests

- Use `console.log()` for debugging
- Run tests in watch mode for faster feedback
- Use `test.only()` to run a specific test
- Check the test coverage report with `npm run test:coverage`
