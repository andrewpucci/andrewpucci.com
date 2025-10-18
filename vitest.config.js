/**
 * @file Vitest configuration
 * @description Configuration for the Vitest unit testing framework.
 * Defines test environment, coverage settings, and exclusions.
 * @see {@link https://vitest.dev/config/|Vitest Configuration}
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable global test APIs (test, expect, etc.) without imports
    globals: true,
    
    // Use happy-dom for lightweight DOM simulation in tests
    environment: 'happy-dom',
    
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**', // Exclude Playwright e2e tests (they use their own runner)
    ],
    coverage: {
      // Coverage report formats
      reporter: ['text', 'json', 'html'],
      
      // Files to exclude from coverage analysis
      exclude: [
        // Default exclusions
        'node_modules/',      // Third-party dependencies
        '**/*.test.js',       // Test files themselves
        '**/test-utils/**',   // Test utilities and helpers
        
        // Configuration files (not application code)
        '**/*.config.*',      // All config files
        '.eslintrc.*',        // ESLint configuration
        '.prettierrc.*',      // Prettier configuration
        'postcss.config.*',   // PostCSS configuration
        'netlify.toml',       // Netlify deployment config
        
        // Generated files and build output
        'dist/**',            // Build output directory
        'coverage/**',        // Coverage reports
        '**/__snapshots__/**', // Test snapshots
        
        // Content and asset files (not JavaScript code)
        'src/site/**/*.md',   // Markdown content
        'src/site/**/*.njk',  // Nunjucks templates
        'src/site/**/*.html', // HTML files
        'src/assets/**',      // Static assets
        
        // Type definitions (TypeScript)
        '**/*.d.ts',
      ],
      
      // Include only source files in coverage analysis
      include: ['src/**/*.js', 'src/**/*.ts'],
      
      // Minimum coverage thresholds (tests fail if below these values)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
