// @ts-check
import { expect, test } from '@playwright/test';

const FIXED_SECURITY_HEADERS = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

/** @param {Record<string, string>} headers */
function expectFixedSecurityHeaders(headers) {
  for (const [name, value] of Object.entries(FIXED_SECURITY_HEADERS)) {
    // oxlint-disable-next-line security/detect-object-injection -- `name` is from the fixed local header map above.
    expect(headers[name], `${name} should be present`).toBe(value);
  }
}

test.describe('HTTP security headers', () => {
  test('protects static and Worker-rendered pages', async ({ request }) => {
    const staticResponse = await request.get('/');
    expect(staticResponse.ok()).toBe(true);
    const staticHeaders = staticResponse.headers();
    expectFixedSecurityHeaders(staticHeaders);
    expect(staticHeaders['content-security-policy']).toBe("frame-ancestors 'none'");
    expect(await staticResponse.text()).toContain(
      '<meta http-equiv="content-security-policy" content="default-src \'none\''
    );

    const workerResponse = await request.get('/contact/');
    expect(workerResponse.ok()).toBe(true);
    const workerHeaders = workerResponse.headers();
    expectFixedSecurityHeaders(workerHeaders);
    expect(workerHeaders['content-security-policy']).toContain("default-src 'none'");
    expect(workerHeaders['content-security-policy']).toContain('https://challenges.cloudflare.com');
  });
});
