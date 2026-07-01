import adapter from '@sveltejs/adapter-cloudflare';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries. Can be removed in Svelte 6.
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
  },
  kit: {
    adapter: adapter(),
    // 'auto' resolves to hash-based CSP for prerendered pages (everything
    // today) and nonce-based CSP for any route rendered per-request in the
    // future (the contact form action). Nonces alone can't work here: kit
    // throws if csp.mode is 'nonce' while prerendering, since a nonce baked
    // into a static file forever isn't a nonce. See ADR-0003's amendment.
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['none'],
        'script-src': ['self'],
        'style-src': ['self'],
        'img-src': ['self', 'data:'],
        'font-src': ['self'],
        'connect-src': ['self'],
        'media-src': ['none'],
        'object-src': ['none'],
        'frame-src': ['none'],
        'worker-src': ['none'],
        'frame-ancestors': ['none'],
        'form-action': ['self'],
        'base-uri': ['self'],
        'manifest-src': ['none'],
        'block-all-mixed-content': true,
      },
    },
  },
  preprocess: [mdsvex({ extensions: ['.svx', '.md'] })],
  extensions: ['.svelte', '.svx', '.md'],
};

export default config;
