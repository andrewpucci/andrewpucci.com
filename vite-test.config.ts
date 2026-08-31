import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'node:path';
import type { TestUserConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

const dirname = import.meta.dirname;

export const testConfig: TestUserConfig = {
  globals: true,
  expect: {
    requireAssertions: true,
  },
  coverage: {
    include: ['src/**/*.{js,ts}'],
    exclude: [
      'node_modules/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/test-utils/**',
      '**/*.config.*',
      'src/**/*.svelte',
      'src/**/*.d.ts',
      '.svelte-kit/**',
      // Page-option declarations and thin universal loads: no branching
      // logic to exercise, just SvelteKit configuration/glue. Real logic
      // (case study lookup, the contact form action) lives elsewhere and
      // stays covered.
      'src/routes/**/+layout.ts',
      'src/routes/**/+page.ts',
      // Typed re-exports of static JSON, nothing to branch on.
      'src/lib/content/author.ts',
      'src/lib/content/cards.ts',
    ],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  projects: [
    // The template's browser-mode `client` project is deliberately absent: it is
    // the separate Vitest component test layer ADR-0010 rules out. Component
    // behavior is tested by Storybook `play()` functions, below.
    {
      extends: './vite.config.ts',
      test: {
        name: 'server',
        environment: 'happy-dom',
        include: [
          'src/**/*.{test,spec}.{js,ts}',
          '.github/actions-scripts/**/*.{test,spec}.{js,ts}',
        ],
        exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
      },
    },
    {
      extends: true,
      plugins: [
        // The plugin will run tests for the stories defined in your Storybook config.
        // See Storybook's Vitest integration for the project configuration.
        storybookTest({
          configDir: path.join(dirname, '.storybook'),
        }),
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [
            {
              browser: 'chromium',
            },
          ],
        },
      },
    },
  ],
};
