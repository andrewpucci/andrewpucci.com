import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll test the actual implementation since mocking is causing issues
const originalEnv = process.env;

describe('min-html', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not minify HTML in development', async () => {
    process.env.NODE_ENV = 'development';
    const { default: minify } = await import('../../src/utils/min-html.js');
    const content = '<div>  test  </div>';
    const result = await minify(content);
    expect(result).toBe(content);
  });

  it('should minify HTML in production', async () => {
    process.env.NODE_ENV = 'production';
    const { default: minify } = await import('../../src/utils/min-html.js');
    const content = '<div>  test  </div>';
    const result = await minify(content);
    // In production, it should be minified (no extra spaces)
    expect(result).not.toContain('  ');
    expect(result).toContain('<div>test</div>');
  });
});
