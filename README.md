# andrewpucci.com

This is the public portfolio site for Andrew Pucci, a UX Designer with development skills. The site showcases professional work, resume, and contact information.

## Tech Stack

- **Static Site Generator**: [Eleventy](https://www.11ty.dev/)
- **Frontend Framework**: [Bootstrap](https://getbootstrap.com/)
- **Styling**: Sass with PostCSS (Autoprefixer, cssnano)
- **Icons**: Font Awesome
- **Testing**:
  - Unit Tests: [Vitest](https://vitest.dev/)
  - E2E Tests: [Playwright](https://playwright.dev/)
- **Deployment**: [Netlify](https://www.netlify.com/)
- **Node Version**: 24.x (see `.tool-versions` and `package.json` for exact versions)

## Project Structure

```
andrewpucci.com/
├── .eleventy.js          # Eleventy configuration
├── src/
│   ├── site/            # Content and templates
│   │   ├── _data/       # Global data files
│   │   ├── _layouts/    # Page layouts (Nunjucks)
│   │   ├── assets/      # Static assets (images, fonts, files)
│   │   ├── portfolio/   # Portfolio project pages
│   │   ├── resume/      # Resume content and entries
│   │   └── index.md     # Home page
│   └── utils/           # Custom filters, shortcodes, and utilities
├── tests/
│   ├── unit/            # Unit tests for utilities and filters
│   └── e2e/             # End-to-end tests with Playwright
├── dist/                # Build output (generated)
└── playwright-report/   # Test reports (generated)
```

## Getting Started

### Prerequisites

- Node.js 24.x or higher (use `mise install` or `asdf install` to switch to the version in `.tool-versions`)
- npm 8.x or higher

### Installation

1. **Clone the repository** and navigate to the project directory:

   ```bash
   git clone https://github.com/andrewpucci/andrewpucci.com.git
   cd andrewpucci.com
   ```

2. **Install Node.js** (if using mise or asdf):

   ```bash
   mise install
   # or: asdf install
   ```

3. **Install dependencies**:

   ```bash
   npm ci
   ```

4. **Set up environment variables**:

   ```bash
   cp .env-sample .env
   ```

   Edit `.env` and set `ROOT_URL` to your local or deployed URL.

### Development

Start the development server with live reload:

```bash
npm run dev
```

The site will be available at `http://localhost:8080`.

### Building for Production

Build the optimized production site:

```bash
npm run prod
```

The built site will be in the `dist/` directory.

## Testing

### Unit Tests

Unit tests cover custom Eleventy filters, shortcodes, and utility functions.

Run all unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

Run tests with UI:

```bash
npm run test:ui
```

See [tests/unit/README.md](tests/unit/README.md) for more details.

### End-to-End Tests

E2E tests verify critical user flows and page content using Playwright.

Run all E2E tests:

```bash
npm run test:e2e
```

Run E2E tests in UI mode (for debugging):

```bash
npm run test:e2e:ui
```

View test report:

```bash
npm run test:e2e:report
```

See [tests/e2e/README.md](tests/e2e/README.md) for more details.

### Running All Tests

Run both unit and E2E tests (CI mode):

```bash
npm run test:ci
```

## Deployment

The site is automatically deployed to Netlify when changes are pushed to the `main` branch.

### Netlify Configuration

- **Build Command**: `npm run prod`
- **Publish Directory**: `dist`
- **Node Version**: 24.x (specified in `.tool-versions`)

See `netlify.toml` for detailed configuration.

## CI/CD

GitHub Actions runs automated tests on:

- All pull requests to `main`
- All pushes to `main`

The CI pipeline:

1. Installs dependencies
2. Runs unit tests
3. Runs E2E tests with retries
4. Uploads test reports as artifacts

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for the full workflow.

## Key Features

- **Responsive Design**: Mobile-first design using Bootstrap 5
- **Performance Optimized**:
  - Asset revisioning for cache busting
  - Image optimization with `@11ty/eleventy-img`
  - HTML/CSS/JS minification
  - PostCSS with Autoprefixer and cssnano
- **SEO Friendly**: Proper meta tags, semantic HTML, and structured data
- **Accessibility**: ARIA labels, semantic markup, keyboard navigation
- **Security**: Content Security Policy headers via Netlify

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests locally: `npm run test:ci`
4. Commit your changes with a descriptive message
5. Push to GitHub and create a pull request
6. Wait for CI checks to pass
7. Merge to `main` after review

## Customization

### Adding Portfolio Projects

1. Create a new Markdown file in `src/site/portfolio/`
2. Add frontmatter with project metadata
3. Write project content using Markdown and Nunjucks shortcodes
4. Add project images to `src/site/assets/images/portfolio/`

### Modifying Styles

1. Edit Sass files in `src/site/assets/styles/`
2. The build process automatically compiles and optimizes CSS
3. Use Bootstrap variables for consistency

### Adding Custom Filters or Shortcodes

1. Add your filter/shortcode to `src/utils/filters.js` or `src/utils/async-shortcodes.js`
2. Register it in `.eleventy.js`
3. Add unit tests in `tests/unit/`

## Troubleshooting

### Build Errors

- **"Cannot find module"**: Run `npm ci` to reinstall dependencies
- **Sass compilation errors**: Check for syntax errors in `.scss` files
- **Image optimization errors**: Ensure images exist in the specified paths

### Test Failures

- **E2E tests failing locally**: Ensure dev server is running on port 8080
- **Flaky E2E tests**: Check for async operations and add proper waits
- **Unit test failures**: Verify that utility functions match expected behavior

## Resources

- [Eleventy Documentation](https://www.11ty.dev/docs/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## Contact

For questions or feedback, visit [andrewpucci.com](https://andrewpucci.com/?ref=github) or connect on [LinkedIn](https://www.linkedin.com/in/andrewpucci).
