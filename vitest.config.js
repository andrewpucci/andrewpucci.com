/**
 * @file Vitest configuration
 * @description Configuration for the Vitest unit testing framework.
 * Defines test environment, coverage settings, and exclusions.
 * @see {@link https://vitest.dev/config/|Vitest Configuration}
 */
export default {
  test: {
    // Enable global test APIs (test, expect, etc.) without imports
    globals: true,

    // Use happy-dom for lightweight DOM simulation in tests
    environment: 'happy-dom',

    // Test file patterns to include
    include: ['**/*.test.js'],

    // Files to exclude from test runs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**', // Exclude Playwright e2e tests (they use their own runner)
    ],

    // Coverage configuration
    coverage: {
      // Files to exclude from coverage analysis
      exclude: [
        // Default exclusions
        'node_modules/**',
        '**/*.test.js',
        '**/test-utils/**',

        // Configuration files
        '**/*.config.*',
        '.eslintrc.*',
        '.oxfmtrc.*',
        'postcss.config.*',

        // Generated files and build output
        'dist/**',
        'coverage/**',
        '**/__snapshots__/**',

        // Content and asset files
        'src/site/**/*.md',
        'src/site/**/*.njk',
        'src/site/**/*.html',
        'src/assets/**',
        '**/*.d.ts',
      ],

      // Include only source files in coverage analysis
      include: ['src/**/*.js'],

      // Minimum coverage thresholds (tests fail if below these values)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
};
