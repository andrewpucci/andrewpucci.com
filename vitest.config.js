import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
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
