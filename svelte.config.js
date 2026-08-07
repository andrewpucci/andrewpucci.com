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
    // Inline the site's small route CSS chunks to avoid render-blocking
    // requests. Keep this above the largest current page stylesheet.
    inlineStyleThreshold: 12_000,
    // 'auto' resolves to hash-based CSP for prerendered pages (everything
    // today) and nonce-based CSP for any route rendered per-request in the
    // future (the contact form action). Nonces alone can't work here: kit
    // throws if csp.mode is 'nonce' while prerendering, since a nonce baked
    // into a static file forever isn't a nonce. See ADR-0003's amendment.
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['none'],
        // challenges.cloudflare.com: the contact form's Turnstile widget
        // (ADR-0005). The one deliberate, documented CSP exception ADR-0003
        // calls for when adding a third-party script.
        'script-src': ['self', 'https://challenges.cloudflare.com'],
        // 'unsafe-inline' here (not on script-src) is a deliberate, narrower
        // exception: Svelte compiles directives like style:transform into
        // runtime element.style mutations (the Carousel's slide position,
        // for one), and those values change per-interaction so they can't be
        // pre-computed as a hash or covered by a nonce the way a fixed
        // inline <script> can. Style injection's blast radius (defacement,
        // narrow data exfiltration via selectors) is a different risk class
        // than script injection, which is why script-src stays hash/nonce-only
        // with no exception. See ADR-0003's amendment.
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:'],
        'font-src': ['self'],
        'connect-src': ['self'],
        'media-src': ['none'],
        'object-src': ['none'],
        'frame-src': ['https://challenges.cloudflare.com'],
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
