import { defineConfig } from '@terrazzo/cli';
import css from '@terrazzo/plugin-css';

export default defineConfig({
  tokens: ['./tokens/tokens.json'],
  outDir: './src/lib/tokens/',
  plugins: [
    css({
      filename: 'tokens.css',
      baseSelector: ':root',
    }),
  ],
});
