// Preserve the trailing-slash URL convention from the Eleventy site
// (/resume/, /portfolio/, etc.) so existing inbound links keep working.
export const trailingSlash = 'always';

// Per ADR-0004: every route prerenders except the contact form action,
// which overrides this in its own +page.ts once it exists.
export const prerender = true;
