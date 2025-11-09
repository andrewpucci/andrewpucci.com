import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';

/**
 * Modern ESLint configuration for AndrewPucci.com
 * Uses the new flat config format (introduced in ESLint 8.21.0+)
 * 
 * Key features:
 * - Modern JavaScript (ES2022+)
 * - Browser and Node.js environments
 * - Security best practices
 * - Airbnb base rules (JavaScript only)
 * - Formatting with Prettier
 */

export default [
  // Base JavaScript rules
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs, // Add commonjs globals
        jQuery: 'readonly',
        $: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    // Ignore patterns (replaces .eslintignore)
    ignores: [
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
    plugins: {
      security,
      import: importPlugin,
    },
    rules: {
      // Base rules from @eslint/js
      ...js.configs.recommended.rules,
      
      // Security plugin rules
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
      
      // Custom rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': ['error', 'properties'],
      'prefer-destructuring': ['error', {
        array: true,
        object: true,
      }, {
        enforceForRenamedProperties: false,
      }],
      // Import rules
      'import/no-unresolved': 'error',
      'import/no-commonjs': 'error',
      'import/no-amd': 'error',
      'import/no-nodejs-modules': 'off',
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: [
          '**/*.test.js',
          '**/*.spec.js',
          '**/tests/**/*.js',
          '**/test/**/*.js',
          '**/__tests__/**/*.js',
          '**/gulpfile.js',
          '**/webpack.config.js',
          '**/rollup.config.js',
          '**/vite.config.js',
          '**/eslint.config.js',
        ],
      }],
    },
  },
  
  // Test files configuration
  {
    files: ['**/*.test.js', '**/tests/**/*.js', '**/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.jest,
      }
    },
    rules: {
      'no-unused-expressions': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
  
  // Config files
  {
    files: ['*.config.js', '.*.js'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
