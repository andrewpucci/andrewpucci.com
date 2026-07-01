/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },
      adapter: adapter(),
      preprocess: [
        mdsvex({
          extensions: ['.svx', '.md'],
        }),
      ],
      extensions: ['.svelte', '.svx', '.md'],
    }),
  ],
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
