const FIXED_SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

/** Adds the fixed security-header envelope without changing SvelteKit's CSP. */
export function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(FIXED_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
}
