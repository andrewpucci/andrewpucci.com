import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { checkRateLimit } from './rate-limiter';

function makeKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string, type?: string) => {
      const raw = store.get(key) ?? null;
      return type === 'json' && raw !== null ? JSON.parse(raw) : raw;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  } as unknown as KVNamespace;
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to 5 requests within a 60s window', async () => {
    const kv = makeKV();
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(kv, '203.0.113.1');
      expect(result).toEqual({ success: true });
    }
  });

  it('rejects the 6th request within the same window', async () => {
    const kv = makeKV();
    for (let i = 0; i < 5; i++) await checkRateLimit(kv, '203.0.113.1');
    const result = await checkRateLimit(kv, '203.0.113.1');
    expect(result).toEqual({ success: false });
  });

  it('resets after the window elapses', async () => {
    const kv = makeKV();
    for (let i = 0; i < 5; i++) await checkRateLimit(kv, '203.0.113.1');
    vi.advanceTimersByTime(60_001);
    const result = await checkRateLimit(kv, '203.0.113.1');
    expect(result).toEqual({ success: true });
  });

  it('tracks separate keys independently', async () => {
    const kv = makeKV();
    for (let i = 0; i < 5; i++) await checkRateLimit(kv, '203.0.113.1');
    const result = await checkRateLimit(kv, '203.0.113.2');
    expect(result).toEqual({ success: true });
  });

  it('writes each entry with a 60s expirationTtl so abandoned keys self-clean', async () => {
    const kv = makeKV();
    await checkRateLimit(kv, '203.0.113.1');
    expect(kv.put).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ expirationTtl: 60 })
    );
  });
});
