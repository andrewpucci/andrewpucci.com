import { describe, expect, it } from 'vite-plus/test';
import { applySecurityHeaders } from './security-headers';

describe('applySecurityHeaders', () => {
  it('adds the fixed security headers without replacing an existing CSP', () => {
    const response = new Response('ok', {
      headers: {
        'content-security-policy': "default-src 'none'; script-src 'nonce-dynamic'",
        'content-type': 'text/plain',
      },
    });

    const secured = applySecurityHeaders(response);

    expect(secured).toBe(response);
    expect(secured.headers.get('content-security-policy')).toBe(
      "default-src 'none'; script-src 'nonce-dynamic'"
    );
    expect(secured.headers.get('content-type')).toBe('text/plain');
    expect(secured.headers.get('strict-transport-security')).toBe(
      'max-age=31536000; includeSubDomains'
    );
    expect(secured.headers.get('x-content-type-options')).toBe('nosniff');
    expect(secured.headers.get('x-frame-options')).toBe('DENY');
    expect(secured.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(secured.headers.get('permissions-policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
  });
});
