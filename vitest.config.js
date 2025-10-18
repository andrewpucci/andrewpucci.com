import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // Exclude Playwright e2e tests from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**', // Exclude Playwright e2e tests
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        // Default exclusions
        'node_modules/',
        '**/*.test.js',
        '**/test-utils/**',
        
        // Configuration files
        '**/*.config.*',
        '.eslintrc.*',
        '.prettierrc.*',
        'postcss.config.*',
        'tailwind.config.*',
        'netlify.toml',
        
        // Generated files
        'dist/**',
        'coverage/**',
        '**/__snapshots__/**',
        
        // Data and asset files
        'src/site/**/*.md',
        'src/site/**/*.njk',
        'src/site/**/*.html',
        'src/assets/**',
        
        // Type definitions
        '**/*.d.ts',
      ],
      // Include only source files in coverage
      include: ['src/**/*.js', 'src/**/*.ts'],
      // Set thresholds for coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
