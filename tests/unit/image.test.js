import { describe, it, expect, vi, beforeEach } from 'vitest';
import { image } from '../../src/utils/image.js';

// Mock the @11ty/eleventy-img module
vi.mock('@11ty/eleventy-img', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation((src, options) => {
    // Return mock metadata based on input
    const { widths, formats } = options;
    const metadata = {};

    formats.forEach(format => {
      metadata[format] = widths.map(width => ({
        sourceType: `image/${format}`,
        srcset: width ? `${src}?w=${width}&format=${format} ${width}w` : `${src}?format=${format}`,
        url: width ? `${src}?w=${width}&format=${format}` : `${src}?format=${format}`,
        width: width || 800, // default width if not specified
        height: width ? Math.round(width * 0.75) : 600, // 4:3 aspect ratio
      }));
    });

    return metadata;
  })
}));

describe('image utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate responsive image markup with default parameters', async () => {
    const result = await image('test.jpg', 'Test alt');
    
    expect(result).toContain('<picture>');
    expect(result).toContain('<source type="image/webp"');
    expect(result).toContain('<source type="image/jpeg"');
    expect(result).toContain('alt="Test alt"');
    expect(result).toContain('loading="lazy"');
    expect(result).toContain('decoding="async"');
  });

  it('should include the provided class in the output', async () => {
    const result = await image('test.jpg', 'Test alt', 'test-class');
    expect(result).toContain('class="test-class"');
  });

  it('should use the provided sizes attribute', async () => {
    const result = await image('test.jpg', 'Test alt', 'test-class', '(max-width: 600px) 100vw, 50vw');
    expect(result).toContain('sizes="(max-width: 600px) 100vw, 50vw"');
  });

  it('should use the provided widths', async () => {
    const customWidths = [300, 600, 900];
    const result = await image('test.jpg', 'Test alt', 'test-class', '100vw', customWidths);
    
    customWidths.forEach(width => {
      expect(result).toContain(`w=${width}`);
    });
  });

  it('should throw an error when alt text is missing', async () => {
    await expect(image('test.jpg')).rejects.toThrow('Missing `alt` on responsive image');
  });

  it('should handle different image formats', async () => {
    const result = await image('test.png', 'PNG Test', 'img-fluid', '100vw', [300, 600]);
    expect(result).toContain('test.png');
    expect(result).toContain('type="image/webp"');
    expect(result).toContain('type="image/jpeg"');
  });
});
