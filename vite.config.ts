/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { terrazzo } from './vite-plugin-terrazzo';
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// `sveltekit()` is called with no arguments so it (and every other tool that
// loads Svelte config the classic way, e.g. Storybook's SvelteKit framework)
// reads the single source of truth in svelte.config.js.
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  // enhancedImages() must come before sveltekit() -- it's a Svelte
  // preprocessor plugin that needs to see <enhanced:img> tags first.
  plugins: [terrazzo(), enhancedImages(), sveltekit()],
  test: {
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
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              {
                browser: 'chromium',
                headless: true,
              },
            ],
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
        },
      },
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'happy-dom',
          include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.test.js'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
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
  },
});
