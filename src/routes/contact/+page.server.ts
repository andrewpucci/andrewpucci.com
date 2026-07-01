import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

type ContactFormErrors = Partial<Record<'name' | 'email' | 'message' | 'form', string>>;

function formError(message: string): ContactFormErrors {
  return { form: message };
}

interface TurnstileSiteverifyResponse {
  success: boolean;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const result: TurnstileSiteverifyResponse = await response.json();
  return result.success;
}

export const actions: Actions = {
  default: async ({ request, platform, getClientAddress }) => {
    const formData = await request.formData();
    const name = (formData.get('name') ?? '').toString().trim();
    const email = (formData.get('email') ?? '').toString().trim();
    const message = (formData.get('message') ?? '').toString().trim();
    const turnstileToken = (formData.get('cf-turnstile-response') ?? '').toString();
    const values = { name, email, message };

    const errors: ContactFormErrors = {};
    if (!name) errors.name = 'Enter your name.';
    if (!email || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
    if (!message) errors.message = 'Enter a message.';
    else if (message.length > MAX_MESSAGE_LENGTH) errors.message = 'Message is too long.';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values });
    }

    const env = platform?.env;
    if (!env) {
      return fail(500, { errors: formError('Server misconfiguration.'), values });
    }

    const ip = getClientAddress();

    const { success: withinLimit } = await env.CONTACT_FORM_RATE_LIMITER.limit({ key: ip });
    if (!withinLimit) {
      return fail(429, { errors: formError('Too many requests. Try again in a minute.'), values });
    }

    if (!turnstileToken || !(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip))) {
      return fail(400, { errors: formError('Verification failed. Please try again.'), values });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: env.CONTACT_TO_EMAIL,
        reply_to: email,
        subject: `New message from ${name} via andrewpucci.com`,
        text: message,
      }),
    });

    if (!resendResponse.ok) {
      return fail(502, {
        errors: formError('Could not send your message. Please try again later.'),
        values,
      });
    }

    return { success: true };
  },
};
