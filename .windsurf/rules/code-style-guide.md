---
trigger: always_on
---

# General Coding Principles

Your overarching goal is to produce code that is clean, efficient, and maintainable.
You should always strive for readability, simplicity, and modularity, regardless of the programming language or context.
Provide solutions in a supportive manner, ensuring that your recommendations are both actionable and adaptable.
Avoid unnecessary complexity: keep your code open to iteration and future growth while preserving its clarity.
Building upon these guiding principles, remember to respect language idioms, choose intuitive naming conventions,
and consider best practices for error handling and testing from the outset.
Whenever possible, aim for solutions that balance clarity with performance, factoring in future scalability and maintainability.

## JavaScript and Node.js Conventions

### ES Modules
- Use ES module syntax (`import`/`export`) throughout the codebase
- Always include `.js` extensions in import statements
- Use named exports for utilities and functions
- Provide default exports for backward compatibility when appropriate

### Async/Await
- Prefer `async`/`await` over Promise chains for better readability
- Always mark functions as `async` when they return Promises
- Handle errors with try/catch blocks in async functions

### Function Declarations
- Use `const` with arrow functions for utility functions
- Use named function expressions for configuration functions (e.g., Eleventy config)
- Keep functions small and focused on a single responsibility

## Respect Language Idioms

Embrace the typical patterns and practices of the language you are using to enhance clarity and consistency.
This improves maintainability and aligns with community standards.

## Write for Humans First

Code should be understandable at a glance, making it more approachable for collaborators and your future self.
Avoid obfuscation or over-optimization that sacrifices readability.

## Future-Proof Your Design

Plan for growth and changing requirements, but do not overengineer. Keep your design flexible enough to adapt
without complicating the initial implementation.

## Code Quality and Readability

### Clarity First

Write straightforward code that conveys its intent clearly. Minimize abstraction layers that obscure readability.

## Documentation Standards

### JSDoc Requirements
- Add file-level JSDoc to every module with `@file`, `@description`, and `@module` tags
- Document all exported functions with:
  - `@param` for each parameter with type and description
  - `@returns` for return values with type
  - `@example` for non-obvious usage
  - `@async` annotation for async functions
  - `@see` links to external documentation when relevant
- Use `@description` to explain the "why" not just the "what"

### Inline Comments
- Add inline comments for:
  - Complex logic that isn't immediately obvious
  - Configuration options and their purpose
  - Performance optimizations
  - Security considerations
  - Browser compatibility workarounds
- Align inline comments for related configuration options
- Keep comments concise but informative

### Example Format
```javascript
/**
 * @file Brief description of the file's purpose
 * @description Detailed explanation of what this module does
 * @module path/to/module
 */

/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return value description
 * @example
 * functionName(input)
 * // Returns: expected output
 */
```

## Testing Standards

### Test Organization
- Use `describe` blocks to group related tests
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- One assertion per test when possible

### Test File Structure
- Add file-level JSDoc with `@file` and `@module` tags
- Add JSDoc to `describe` blocks explaining what's being tested
- Add JSDoc to complex test cases explaining the test strategy

### Naming Conventions
- Test files: `*.test.js` for unit tests, `*.spec.js` for E2E tests
- Test descriptions: Use "should" statements (e.g., "should format date correctly")
- Avoid generic names like "works" or "is correct"

## Eleventy Static Site Generator

### Configuration
- Register plugins before filters and shortcodes
- Group related configurations together (filters, shortcodes, collections)
- Add inline comments explaining each plugin's purpose
- Document collection sorting logic

### Filters and Shortcodes
- Filters should be pure functions when possible
- Async shortcodes must be registered with `addNunjucksAsyncShortcode`
- Always validate required parameters (e.g., alt text for images)
- Throw descriptive errors for missing required parameters

### File Organization
- Utility functions in `src/utils/`
- Content in `src/site/`
- Templates in `src/site/_layouts/`
- Data files in `src/site/_data/`

## Descriptive Naming

Use meaningful, consistent names for variables, functions, classes, and modules that reflect their purpose.

### Consistent Formatting

Follow established style guides and use automated tools to maintain uniform formatting across the codebase.

### Comment Thoughtfully

Provide comments or docstrings where necessary, but avoid restating what the code already expresses.

## Architecture and Modularity

### Encapsulate Complexity

Group related logic into self-contained modules or classes with clear, well-documented interfaces.

### Loose Coupling

Design components to function independently, using abstraction layers or interfaces to reduce interdependencies.

### Apply DRY

Refactor repetitive or duplicated code into shared utilities or functions to promote reuse and reduce bloat.

### Design for Extensibility

Structure your codebase so you can add new features and functionalities without requiring major rewrites.

## Error Handling and Testing

### Follow Linting Rules

Use automated tools to enforce consistent coding standards and catch potential errors early.

### Error Awareness

Implement robust error handling with clear messages and safe fallback paths for smoother recoveries.

### Write Tests Early

Create relevant tests at the outset of development to quickly capture edge cases and catch regressions.

### Iterative Validation

Run your tests frequently to ensure ongoing stability and to identify potential issues as your code evolves.

### Proactive Debugging

Leverage logging, tracing, and profiling to diagnose and resolve errors efficiently.

## Performance and Resource Management

### Choose Efficient Solutions

Adopt algorithms and data structures that suit your problem domain, optimizing for efficiency and scalability.

### Optimize When Necessary

Maintain clarity in your codebase; address performance bottlenecks only after conducting proper profiling.

### Manage Resources Properly

Follow best practices for handling external resources. For example, use `with` statements where applicable.

### Environment-Specific Optimizations
- Only minify in production environments (check `NODE_ENV`)
- Use lazy loading for images (`loading="lazy"`)
- Generate multiple image sizes for responsive images
- Enable asset revisioning for cache busting

### Build Performance
- Use passthrough copy for static assets that don't need processing
- Configure Sass to suppress deprecation warnings from dependencies
- Enable source maps in development, disable in production

## Git Commands

Never use or ask me to use terminal commands for Git operations in the cascade chat.

## Commit Message in Cascade Chat

Write a short commit message in English (maximum one sentence) for every change you make, and always format it in a code block. Use the following guidelines for consistent and descriptive commit messages:

prefix: short description (maximum one sentence)

Commit Prefixes:

- feat: Introduce a new feature.
- fix: Fix a bug or issue.
- tweak: Make minor adjustments or improvements.
- style: Update code style or formatting.
- refactor: Restructure code without changing functionality.
- perf: Improve performance or efficiency.
- test: Add or update tests.
- docs: Update documentation.
- chore: Perform maintenance tasks or updates.
- ci: Change CI/CD configuration.
- build: Modify build system or dependencies.
- revert: Revert a previous commit.
- hotfix: Apply an urgent bug fix.
- init: Initialize a new project or feature.
- merge: Merge branches.
- wip: Mark work in progress.
- release: Prepare for a release.

## Configuration Files

### Inline Documentation
- Add comments for every configuration option
- Explain the purpose and impact of each setting
- Document environment-specific settings (CI vs local)
- Include links to official documentation for complex options

### Structure
- Group related settings together
- Use consistent comment alignment for readability
- Explain rationale for non-obvious choices (e.g., "single worker in CI for stability")

## Security and Accessibility

### Security
- Validate and sanitize user inputs
- Use Content Security Policy headers
- Obfuscate sensitive information (e.g., email addresses)
- Follow security plugin recommendations (eslint-plugin-security)

### Accessibility
- Always provide alt text for images (throw error if missing)
- Use semantic HTML elements
- Include ARIA labels for interactive elements
- Ensure keyboard navigation works
- Use descriptive link text (avoid "click here")

## Project-Specific Patterns

### Bootstrap Integration
- Use Bootstrap 5 classes for styling
- Leverage Bootstrap components (cards, modals, etc.)
- Use stretched-link for clickable card areas
- Follow Bootstrap's responsive breakpoints

### Image Handling
- Use @11ty/eleventy-img for all images
- Generate WebP and JPEG formats
- Provide multiple widths for responsive images
- Include width and height attributes to prevent layout shift

### Backward Compatibility
- Export both named and default exports from utility modules
- Maintain existing API signatures when refactoring