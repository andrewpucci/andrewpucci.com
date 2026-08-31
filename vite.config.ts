/// <reference types="vite-plus" />
import { defineConfig, lazyPlugins, type PluginOption } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { terrazzo } from './vite-plugin-terrazzo';
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function appPlugins(): PluginOption[] {
  return [
    terrazzo() as PluginOption,
    enhancedImages() as PluginOption,
    sveltekit() as PluginOption,
  ];
}

// `sveltekit()` is called with no arguments so it (and every other tool that
// loads Svelte config the classic way, e.g. Storybook's SvelteKit framework)
// reads the single source of truth in svelte.config.ts.
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  server: {
    port: 8080,
  },
  preview: {
    port: 4173,
  },
  build: {
    // Keep the production bundle aligned with Vite's modern Baseline target.
    // Accessibility support is validated separately with keyboard and AT checks.
    target: 'baseline-widely-available',
  },
  fmt: {
    singleQuote: true,
    trailingComma: 'es5',
    semi: true,
    printWidth: 100,
    sortPackageJson: false,
    ignorePatterns: ['node_modules/', 'dist/', 'coverage/', 'playwright-report/', 'test-results/'],
  },
  lint: {
    plugins: [],
    categories: {
      correctness: 'off',
    },
    env: {
      builtin: true,
    },
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.cache/**',
      '**/.temp/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/*.min.js',
      '**/bundle.js',
    ],
    overrides: [
      {
        files: ['**/*.{js,mjs,cjs}'],
        rules: {
          'constructor-super': 'error',
          'for-direction': 'error',
          'no-async-promise-executor': 'error',
          'no-case-declarations': 'error',
          'no-class-assign': 'error',
          'no-compare-neg-zero': 'error',
          'no-cond-assign': 'error',
          'no-const-assign': 'error',
          'no-constant-binary-expression': 'error',
          'no-constant-condition': 'error',
          'no-control-regex': 'error',
          'no-debugger': 'warn',
          'no-delete-var': 'error',
          'no-dupe-class-members': 'error',
          'no-dupe-else-if': 'error',
          'no-dupe-keys': 'error',
          'no-duplicate-case': 'error',
          'no-empty': 'error',
          'no-empty-character-class': 'error',
          'no-empty-pattern': 'error',
          'no-empty-static-block': 'error',
          'no-ex-assign': 'error',
          'no-extra-boolean-cast': 'error',
          'no-fallthrough': 'error',
          'no-func-assign': 'error',
          'no-global-assign': 'error',
          'no-import-assign': 'error',
          'no-invalid-regexp': 'error',
          'no-irregular-whitespace': 'error',
          'no-loss-of-precision': 'error',
          'no-misleading-character-class': 'error',
          'no-new-native-nonconstructor': 'error',
          'no-nonoctal-decimal-escape': 'error',
          'no-obj-calls': 'error',
          'no-prototype-builtins': 'error',
          'no-redeclare': 'error',
          'no-regex-spaces': 'error',
          'no-self-assign': 'error',
          'no-setter-return': 'error',
          'no-shadow-restricted-names': 'error',
          'no-sparse-arrays': 'error',
          'no-this-before-super': 'error',
          'no-unexpected-multiline': 'error',
          'no-unsafe-finally': 'error',
          'no-unsafe-negation': 'error',
          'no-unsafe-optional-chaining': 'error',
          'no-unused-labels': 'error',
          'no-unused-private-class-members': 'error',
          'no-unused-vars': [
            'warn',
            {
              argsIgnorePattern: '^_',
            },
          ],
          'no-useless-backreference': 'error',
          'no-useless-catch': 'error',
          'no-useless-escape': 'error',
          'no-with': 'error',
          'require-yield': 'error',
          'use-isnan': 'error',
          'valid-typeof': 'error',
          'security/detect-object-injection': 'warn',
          'security/detect-possible-timing-attacks': 'error',
          'security/detect-non-literal-fs-filename': 'warn',
          'security/detect-unsafe-regex': 'error',
          'security/detect-buffer-noassert': 'error',
          'security/detect-child-process': 'error',
          'security/detect-eval-with-expression': 'error',
          'security/detect-no-csrf-before-method-override': 'error',
          'security/detect-non-literal-regexp': 'error',
          'security/detect-non-literal-require': 'error',
          'security/detect-pseudoRandomBytes': 'error',
          'no-console': 'off',
          'no-var': 'error',
          'prefer-const': 'error',
          'arrow-body-style': ['error', 'as-needed'],
          'prefer-destructuring': [
            'error',
            {
              array: true,
              object: true,
            },
            {
              enforceForRenamedProperties: false,
            },
          ],
          'import/no-commonjs': 'error',
          'import/no-amd': 'error',
          'import/no-nodejs-modules': 'off',
          'import/first': 'error',
          'import/no-duplicates': 'error',
        },
        jsPlugins: ['eslint-plugin-security'],
        env: {
          es2026: true,
          browser: true,
          jquery: true,
          node: true,
        },
        plugins: ['import'],
      },
      {
        files: [
          '**/*.test.{js,mjs,cjs}',
          '**/tests/**/*.{js,mjs,cjs}',
          '**/__tests__/**/*.{js,mjs,cjs}',
        ],
        rules: {
          'no-unused-expressions': 'off',
        },
        env: {
          jest: true,
          mocha: true,
        },
      },
      {
        files: ['**/*.cjs'],
        rules: {
          'import/no-commonjs': 'off',
          'import/no-amd': 'off',
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
  },
  // enhancedImages() must come before sveltekit() -- it's a Svelte
  // preprocessor plugin that needs to see <enhanced:img> tags first.
  plugins: lazyPlugins(appPlugins),
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
