import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import fc from 'fast-check';
import { checkRateLimit } from '$lib/server/rate-limiter';
import { actions, load } from './+page.server';

vi.mock('$lib/server/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}));

const checkRateLimitMock = vi.mocked(checkRateLimit);

function makeFormData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function makeEvent(fields: Record<string, string>, platform?: App.Platform) {
  return {
    request: {
      formData: async () => makeFormData(fields),
    } as unknown as Request,
    platform,
    getClientAddress: () => '203.0.113.1',
  } as Parameters<NonNullable<typeof actions.default>>[0];
}

const validFields = {
  name: 'Jane Tester',
  email: 'jane@example.com',
  message: 'Hello there',
};

const validTurnstileResponse = {
  success: true,
  action: 'turnstile-spin-v2',
  hostname: 'andrewpucci.com',
};

const whitespaceOnlyString = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { maxLength: 32 })
  .map((characters) => characters.join(''));

const nonEmptyTrimmedString = fc
  .string({ maxLength: 256 })
  .filter((value) => value.trim().length > 0);

const overlongNonWhitespaceMessage = fc
  .array(fc.constantFrom('a', 'b', 'c', '1', '-', '_'), { minLength: 5001, maxLength: 5500 })
  .map((characters) => characters.join(''));

function makePlatform(overrides: Partial<App.Platform['env']> = {}): App.Platform {
  return {
    env: {
      // checkRateLimit is mocked above, so this stub is never actually read.
      CONTACT_FORM_RATE_LIMITER: {} as KVNamespace,
      PUBLIC_TURNSTILE_SITE_KEY: ' site-key ',
      TURNSTILE_HOSTNAMES: 'andrewpucci.com, preview.andrewpucci.com',
      TURNSTILE_SECRET: 'secret',
      RESEND_API_KEY: 're_test',
      CONTACT_TO_EMAIL: 'hi@andrewpucci.com',
      CONTACT_FROM_EMAIL: 'contact@andrewpucci.com',
      ...overrides,
    },
  } as unknown as App.Platform;
}

describe('contact form action: validation', () => {
  it('rejects an empty submission and preserves (empty) values', async () => {
    const result = await actions.default!(makeEvent({ name: '', email: '', message: '' }));
    expect(result?.status).toBe(400);
    expect(result?.data?.errors).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address.',
      message: 'Enter a message.',
    });
  });

  it('rejects an invalid email and preserves the submitted values', async () => {
    const result = await actions.default!(
      makeEvent({ name: 'Jane', email: 'not-an-email', message: 'Hi' })
    );
    expect(result?.status).toBe(400);
    expect(result?.data?.errors).toEqual({
      email: 'Enter a valid email address.',
    });
    expect(result?.data?.values).toEqual({
      name: 'Jane',
      email: 'not-an-email',
      message: 'Hi',
    });
  });

  it('rejects a message over the length limit', async () => {
    const result = await actions.default!(makeEvent({ ...validFields, message: 'x'.repeat(5001) }));
    expect(result?.status).toBe(400);
    expect(result?.data?.errors).toEqual({ message: 'Message is too long.' });
  });

  it('rejects names that collapse to empty after trimming', async () => {
    await fc.assert(
      fc.asyncProperty(whitespaceOnlyString, nonEmptyTrimmedString, async (name, message) => {
        const result = await actions.default!(
          makeEvent({ name, email: validFields.email, message })
        );

        expect(result?.status).toBe(400);
        expect(result?.data?.errors?.name).toBe('Enter your name.');
      }),
      { numRuns: 50 }
    );
  });

  it('rejects messages longer than the server-side limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyTrimmedString,
        overlongNonWhitespaceMessage,
        async (name, message) => {
          const result = await actions.default!(
            makeEvent({ name, email: validFields.email, message })
          );

          expect(result?.status).toBe(400);
          expect(result?.data?.errors?.message).toBe('Message is too long.');
        }
      ),
      { numRuns: 25 }
    );
  });

  it('trims surrounding whitespace from otherwise valid emails before later checks', async () => {
    await fc.assert(
      fc.asyncProperty(
        whitespaceOnlyString,
        whitespaceOnlyString,
        nonEmptyTrimmedString,
        nonEmptyTrimmedString,
        async (leadingWhitespace, trailingWhitespace, name, message) => {
          const result = await actions.default!(
            makeEvent({
              name,
              email: `${leadingWhitespace}${validFields.email}${trailingWhitespace}`,
              message,
            })
          );

          expect(result?.status).toBe(500);
          expect(result?.data?.errors).toEqual({ form: 'Server misconfiguration.' });
          expect(result?.data?.values).toEqual({
            name: name.trim(),
            email: validFields.email,
            message: message.trim(),
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('contact form page load', () => {
  it('reads the Turnstile site key from the Cloudflare runtime env', async () => {
    const data = (await load({ platform: makePlatform() } as Parameters<typeof load>[0])) as {
      turnstileSiteKey: string;
    };
    expect(data.turnstileSiteKey).toBe('site-key');
  });
});

describe('contact form action: server-side checks', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    consoleErrorSpy.mockClear();
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ success: true });
  });

  it('fails with 500 when platform.env is unavailable', async () => {
    const result = await actions.default!(makeEvent(validFields, undefined));
    expect(result?.status).toBe(500);
    expect(result?.data?.errors).toEqual({ form: 'Server misconfiguration.' });
  });

  it('fails with 500 when a required runtime value is blank', async () => {
    const result = await actions.default!(
      makeEvent(validFields, makePlatform({ CONTACT_FROM_EMAIL: '   ' }))
    );
    expect(result?.status).toBe(500);
    expect(result?.data?.errors).toEqual({ form: 'Server misconfiguration.' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Missing contact form runtime config');
  });

  it('fails with 429 when the rate limiter rejects the request', async () => {
    checkRateLimitMock.mockResolvedValue({ success: false });
    const platform = makePlatform();
    const result = await actions.default!(makeEvent(validFields, platform));
    expect(result?.status).toBe(429);
    expect(result?.data?.errors?.form).toMatch(/too many requests/i);
  });

  it('fails open and falls through to Turnstile when checkRateLimit throws', async () => {
    // A KV outage shouldn't block legitimate submissions -- rate limiting
    // is defense-in-depth behind Turnstile, not the primary abuse control.
    checkRateLimitMock.mockRejectedValue(new Error('KV unavailable'));
    const platform = makePlatform();
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
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ success: true });
  });

  it('fails with 400 when Turnstile verification fails', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-secret'],
        hostname: 'nav-mobile-expand-and-download-alignment.andrewpucci.pages.dev',
      }),
    });
    const platform = makePlatform();
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );
    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Turnstile verification failed',
      expect.objectContaining({
        errorCodes: ['invalid-input-secret'],
        hasToken: true,
        hostname: 'nav-mobile-expand-and-download-alignment.andrewpucci.pages.dev',
      })
    );
  });

  it('fails with 400 when Turnstile reports an unexpected action', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ ...validTurnstileResponse, action: 'newsletter-signup' }),
    });
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, makePlatform())
    );

    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with 400 when Turnstile reports a hostname outside the allowlist', async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ ...validTurnstileResponse, hostname: 'attacker.example' }),
    });
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, makePlatform())
    );

    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with 400 when Siteverify cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network unavailable'));
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, makePlatform())
    );

    expect(result?.status).toBe(400);
    expect(result?.data?.errors?.form).toMatch(/verification failed/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with 502 when Resend rejects the email', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => validTurnstileResponse })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          get: (name: string) => (name === 'x-request-id' ? 'req_123' : null),
        },
        json: async () => ({
          message:
            'The `andrewpucci.com` domain is not verified. Please, add and verify your domain.',
          name: 'validation_error',
          statusCode: 403,
        }),
      });
    const platform = makePlatform();
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );
    expect(result?.status).toBe(502);
    expect(result?.data?.errors?.form).toMatch(/could not send/i);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Resend email send failed',
      expect.objectContaining({
        fromDomain: 'andrewpucci.com',
        requestId: 'req_123',
        resendError: expect.objectContaining({
          name: 'validation_error',
          statusCode: 403,
        }),
        status: 403,
        statusText: 'Forbidden',
        toDomain: 'andrewpucci.com',
      })
    );
  });

  it('logs the plain-text Resend error when JSON parsing fails', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => validTurnstileResponse })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (name: string) => (name === 'x-request-id' ? 'req_text' : null),
        },
        json: async () => {
          throw new Error('invalid json');
        },
        text: async () => 'upstream unavailable',
      });
    const platform = makePlatform();

    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );

    expect(result?.status).toBe(502);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Resend email send failed',
      expect.objectContaining({
        requestId: 'req_text',
        resendError: 'upstream unavailable',
        status: 500,
      })
    );
  });

  it('logs a null Resend error when the fallback text is blank', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => validTurnstileResponse })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {
          get: (name: string) => (name === 'x-request-id' ? 'req_blank' : null),
        },
        json: async () => {
          throw new Error('invalid json');
        },
        text: async () => '   ',
      });
    const platform = makePlatform();

    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );

    expect(result?.status).toBe(502);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Resend email send failed',
      expect.objectContaining({
        requestId: 'req_blank',
        resendError: null,
        status: 422,
      })
    );
  });

  it('trims email configuration before sending to Resend', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => validTurnstileResponse })
      .mockResolvedValueOnce({ ok: true });
    const platform = makePlatform({
      CONTACT_FROM_EMAIL: ' contact@andrewpucci.com ',
      CONTACT_TO_EMAIL: ' hi@andrewpucci.com ',
      RESEND_API_KEY: ' re_test ',
      TURNSTILE_SECRET: ' secret ',
    });

    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.resend.com/emails',
      expect.objectContaining({
        body: JSON.stringify({
          from: 'andrewpucci.com contact <contact@andrewpucci.com>',
          to: 'hi@andrewpucci.com',
          reply_to: 'jane@example.com',
          subject: 'New message from Jane Tester via andrewpucci.com',
          text: [
            'Name: Jane Tester',
            'Email: jane@example.com',
            '',
            'Message:',
            'Hello there',
          ].join('\n'),
        }),
        headers: expect.objectContaining({
          authorization: 'Bearer re_test',
          'content-type': 'application/json',
        }),
      })
    );
  });

  it('succeeds when Turnstile and Resend both accept the request', async () => {
    fetchMock
      .mockResolvedValueOnce({ json: async () => validTurnstileResponse })
      .mockResolvedValueOnce({ ok: true });
    const platform = makePlatform();
    const result = await actions.default!(
      makeEvent({ ...validFields, 'cf-turnstile-response': 'token' }, platform)
    );
    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.resend.com/emails',
      expect.objectContaining({
        body: JSON.stringify({
          from: 'andrewpucci.com contact <contact@andrewpucci.com>',
          to: 'hi@andrewpucci.com',
          reply_to: 'jane@example.com',
          subject: 'New message from Jane Tester via andrewpucci.com',
          text: [
            'Name: Jane Tester',
            'Email: jane@example.com',
            '',
            'Message:',
            'Hello there',
          ].join('\n'),
        }),
      })
    );
  });
});
