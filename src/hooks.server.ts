import type { Handle } from '@sveltejs/kit';
import { applySecurityHeaders } from '$lib/server/security-headers';

export const handle: Handle = async ({ event, resolve }) =>
  applySecurityHeaders(await resolve(event));
