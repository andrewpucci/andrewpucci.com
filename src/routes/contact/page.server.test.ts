import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { actions } from './+page.server';

function makeFormData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function makeEvent(fields: Record<string, string>, platform?: App.Platform) {
  return {
    request: { formData: async () => makeFormData(fields) } as unknown as Request,
    platform,
    getClientAddress: () => '203.0.113.1',
  } as Parameters<NonNullable<typeof actions.default>>[0];
}

const validFields = { name: 'Jane Tester', email: 'jane@example.com', message: 'Hello there' };

function makePlatform(
  overrides: { rateLimitOk?: boolean; rateLimiter?: false } = {}
): App.Platform {
  return {
    env: {
      ...(overrides.rateLimiter === false
        ? {}
        : {
            CONTACT_FORM_RATE_LIMITER: {
              limit: vi.fn().mockResolvedValue({ success: overrides.rateLimitOk ?? true }),
            },
          }),
      TURNSTILE_SECRET: 'secret',
      RESEND_API_KEY: 're_test',
      CONTACT_TO_EMAIL: 'hi@andrewpucci.com',
      CONTACT_FROM_EMAIL: 'contact@andrewpucci.com',
    },
  } as unknown as App.Platform;
}

describe('contact form action: validation', () => {
  it('rejects an empty submission and preserves (empty) values', async () => {
    const result = await actions.default!(makeEvent({ name: '', email: '', message: '' }));
    expect(result?.status).toBe(400);
    expect(result?.data?.errors).toEqual({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      message: 'Enter a message.',
    });
  });

  it('rejects an invalid email and preserves the submitted values', async () => {
    const result = await actions.default!(
      makeEvent({ name: 'Jane', email: 'not-an-email', message: 'Hi' })
    );
    expect(result?.status).toBe(400);
    expect(result?.data?.errors).toEqual({ email: 'Enter a valid email address.' });
    expect(result?.data?.values).toEqual({ name: 'Jane', email: 'not-an-email', message: 'Hi' });
  });

  it('rejects a message over the length limit', async () => {
    const result = await actions.default!(makeEvent({ ...validFields, message: 'x'.repeat(5001) }));
    expect(result?.status).toBe(400);
    expect(result?.data?.errors).toEqual({ message: 'Message is too long.' });
  });
});

describe('contact form action: server-side checks', () => {
  it('fails with 500 when platform.env is unavailable', async () => {
    const result = await actions.default!(makeEvent(validFields, undefined));
    expect(result?.status).toBe(500);
    expect(result?.data?.errors).toEqual({ form: 'Server misconfiguration.' });
  });

  it('fails with 429 when the rate limiter rejects the request', async () => {
    const platform = makePlatform({ rateLimitOk: false });
    const result = await actions.default!(makeEvent(validFields, platform));
    expect(result?.status).toBe(429);
    expect(result?.data?.errors?.form).toMatch(/too many requests/i);
  });

  it('falls through to Turnstile when the rate limit binding is absent', async () => {
    // The deployed Pages runtime has no rate limit binding; an unguarded
    // .limit() call made every production submission a 500.
    const platform = makePlatform({ rateLimiter: false });
    const result = await actions.default!(makeEvent(validFields, platform));
    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
  });

  it('fails with 400 when no Turnstile token is present', async () => {
    const platform = makePlatform();
    const result = await actions.default!(makeEvent(validFields, platform));
    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
  });
});

describe('contact form action: Turnstile + Resend', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('fails with 400 when Turnstile verification fails', async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ success: false }) });
    const platform = makePlatform();
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );
    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with 502 when Resend rejects the email', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: false });
    const platform = makePlatform();
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );
    expect(result?.status).toBe(502);
    expect(result?.data?.errors?.form).toMatch(/could not send/i);
  });

  it('succeeds when Turnstile and Resend both accept the request', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true });
    const platform = makePlatform();
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );
    expect(result).toEqual({ success: true });
  });
});
