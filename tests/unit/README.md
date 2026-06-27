# Unit Tests

This directory contains unit tests for the Eleventy build process, custom filters, shortcodes, and utility functions. Unit tests ensure that individual components work correctly in isolation.

## Overview

Unit tests use [Vitest](https://vitest.dev/), a fast unit test framework that's compatible with Jest APIs. Tests run in a Node.js environment with [happy-dom](https://github.com/capricorn86/happy-dom) for DOM simulation.

## Test Structure

```
tests/unit/
├── async-shortcodes.test.js  # Tests for async shortcodes (image, card, expandableImage)
├── filters.test.js           # Tests for custom Eleventy filters (dateToFormat, obfuscate, etc.)
├── image.test.js             # Tests for image processing and optimization
├── min-html.test.js          # Tests for HTML minification transform
├── min-js.test.js            # Tests for JavaScript minification
├── minify.test.js            # Core minification logic tests
├── site-data.test.js         # Tests for site data processing and environment variables
└── README.md                 # This file
```

## Running Tests

### Basic Commands

```bash
# Run all unit tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui

# Update snapshots
npm run test:update
```

### Running Specific Tests

```bash
# Run a specific test file
npx vitest run tests/unit/filters.test.js

# Run tests matching a pattern
npx vitest run --grep "dateToFormat"

# Run only tests marked with .only()
npx vitest run
```

## Test Configuration

Tests are configured in `vitest.config.js`:

- **Test Environment**: `happy-dom` (lightweight DOM implementation)
- **Globals**: Enabled (no need to import `test`, `expect`, etc.)
- **Coverage**: V8 provider with 80% threshold for lines, functions, branches, and statements
- **Exclusions**: E2E tests are excluded from Vitest (they run with Playwright)

## Test Conventions

### File Naming

- Test files use the pattern `*.test.js`
- Test filenames should match or describe what they test
- Keep test files in the `tests/unit/` directory

### Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../../src/utils/filters.js';

describe('functionToTest', () => {
  it('should do something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });

  it('should handle edge cases', () => {
    expect(() => functionToTest(null)).toThrow();
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested

   ```javascript
   // Good
   it('should format date as MM/DD/YYYY when given a valid date string', () => {...});

   // Bad
   it('works', () => {...});
   ```

2. **Arrange-Act-Assert Pattern**: Structure tests clearly

   ```javascript
   it('should calculate total price', () => {
     // Arrange
     const items = [{ price: 10 }, { price: 20 }];

     // Act
     const total = calculateTotal(items);

     // Assert
     expect(total).toBe(30);
   });
   ```

3. **Test One Thing**: Each test should verify one specific behavior

4. **Avoid Test Interdependence**: Tests should not depend on each other

5. **Use Appropriate Matchers**: Choose the right assertion for clarity
   ```javascript
   expect(value).toBe(5); // Strict equality
   expect(obj).toEqual({ a: 1 }); // Deep equality
   expect(arr).toContain('item'); // Array contains
   expect(fn).toThrow(); // Function throws
   ```

## Writing New Tests

### Step-by-Step Guide

1. **Create a test file**

   ```bash
   touch tests/unit/my-feature.test.js
   ```

2. **Import dependencies**

   ```javascript
   import { describe, it, expect } from 'vitest';
   import { myFunction } from '../../src/utils/my-feature.js';
   ```

3. **Write test cases**

   ```javascript
   describe('myFunction', () => {
     it('should handle normal input', () => {
       expect(myFunction('input')).toBe('expected');
     });

     it('should handle edge cases', () => {
       expect(myFunction('')).toBe('');
       expect(myFunction(null)).toBe(null);
     });

     it('should throw on invalid input', () => {
       expect(() => myFunction(undefined)).toThrow();
     });
   });
   ```

4. **Run your tests**
   ```bash
   npm run test:watch
   ```

### Testing Async Functions

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Mocking

```javascript
import { vi } from 'vitest';

it('should use mocked function', () => {
  const mockFn = vi.fn(() => 'mocked');
  expect(mockFn()).toBe('mocked');
  expect(mockFn).toHaveBeenCalled();
});
```

## Coverage Requirements

The project maintains a minimum coverage threshold of 80% for:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

To check coverage:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Debugging Tests

### Console Logging

```javascript
it('should debug output', () => {
  const result = myFunction(input);
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### Running Specific Tests

```javascript
// Run only this test
it.only('should run only this test', () => {...});

// Skip this test
it.skip('should skip this test', () => {...});
```

### Watch Mode

Watch mode automatically re-runs tests when files change:

```bash
npm run test:watch
```

### Interactive UI

Vitest UI provides a visual interface for debugging:

```bash
npm run test:ui
```

## Common Testing Patterns

### Testing Filters

```javascript
import { dateToFormat } from '../../src/utils/filters.js';

describe('dateToFormat', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(dateToFormat(date, 'MM/DD/YYYY')).toBe('01/15/2024');
  });
});
```

### Testing Shortcodes

```javascript
import { image } from '../../src/utils/async-shortcodes.js';

describe('image shortcode', () => {
  it('should generate responsive image HTML', async () => {
    const html = await image('path/to/image.jpg', 'Alt text');
    expect(html).toContain('<img');
    expect(html).toContain('alt="Alt text"');
  });
});
```

### Testing Transformations

```javascript
import minify from '../../src/utils/minify.js';

describe('minify transform', () => {
  it('should minify HTML', () => {
    const html = '<div>  <p>  Text  </p>  </div>';
    const minified = minify(html, '.html');
    expect(minified).not.toContain('  ');
  });
});
```

## Troubleshooting

### Tests Not Running

- Ensure test files match the `*.test.js` pattern
- Check that test files are not in the `tests/e2e/` directory (excluded from Vitest)
- Verify Node.js version matches project requirements (24.x)

### Import Errors

- Ensure you're using ES modules syntax (`import`/`export`)
- Check that file paths are correct and include `.js` extensions
- Verify `package.json` has `"type": "module"`

### Coverage Not Meeting Threshold

- Run `npm run test:coverage` to see detailed coverage report
- Add tests for uncovered lines/branches
- Check `vitest.config.js` for coverage exclusions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Matchers (compatible with Vitest)](https://jestjs.io/docs/expect)
