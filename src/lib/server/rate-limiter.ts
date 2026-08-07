const WINDOW_SECONDS = 60;
const WINDOW_MS = WINDOW_SECONDS * 1_000;
const MAX_REQUESTS_PER_WINDOW = 5;

interface RateLimitResult {
  success: boolean;
}

interface WindowState {
  count: number;
  windowStart: number;
}

// windowStart (not the KV entry's TTL) is the source of truth for whether
// the window has elapsed -- expirationTtl only exists so abandoned keys
// self-clean, since KV has no expressive query/scan to prune them otherwise.
export async function checkRateLimit(kv: KVNamespace, key: string): Promise<RateLimitResult> {
  const now = Date.now();
  const stored = await kv.get<WindowState>(`ratelimit:${key}`, 'json');
  const windowExpired = !stored || now - stored.windowStart >= WINDOW_MS;
  const current: WindowState = windowExpired ? { count: 0, windowStart: now } : stored;

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { success: false };
  }

  current.count += 1;
  await kv.put(`ratelimit:${key}`, JSON.stringify(current), { expirationTtl: WINDOW_SECONDS });
  return { success: true };
}
