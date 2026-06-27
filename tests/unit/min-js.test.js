import { describe, it, expect, vi } from 'vitest';
import minify from '../../src/utils/min-js.js';
import { minify as terserMinify } from 'terser';

// Mock the terser module
vi.mock('terser', () => ({
  minify: vi.fn().mockResolvedValue({ code: 'minified:code' }),
}));

describe('min-js', () => {
  it('should minify JavaScript code', async () => {
    const code = 'function test() { console.log("test"); }';
    const result = await minify(code);
    expect(result).toBe('minified:code');
    expect(terserMinify).toHaveBeenCalledWith(code, {});
  });

  it('should handle empty input', async () => {
    const result = await minify('');
    expect(result).toBe('minified:code');
  });
});
