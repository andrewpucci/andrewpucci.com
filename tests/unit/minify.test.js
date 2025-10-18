import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the path module with the original implementation but override extname
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    extname: (path) => {
      // Simple extension extractor for testing
      const match = path.match(/\.([^.]+)$/i);
      return match ? `.${match[1].toLowerCase()}` : '';
    }
  };
});

// Mock the minification modules with simple implementations
vi.mock('../../src/utils/min-html.js', () => ({
  default: (content) => `minified-html:${content}`
}));

vi.mock('../../src/utils/min-js.js', () => ({
  default: (content) => `minified-js:${content}`
}));

// Import the minify function after setting up mocks
import minify from '../../src/utils/minify.js';

describe('minify utility', () => {
  let originalConsoleError;
  let originalHtmlMin;
  let originalJsMin;

  beforeEach(async () => {
    // Store original implementations
    originalHtmlMin = (await import('../../src/utils/min-html.js')).default;
    originalJsMin = (await import('../../src/utils/min-js.js')).default;
    
    // Store original console.error
    originalConsoleError = console.error;
    // Mock console.error to prevent test output pollution
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original implementations
    (async () => {
      (await import('../../src/utils/min-html.js')).default = originalHtmlMin;
      (await import('../../src/utils/min-js.js')).default = originalJsMin;
    })();
    
    // Restore original console.error
    console.error = originalConsoleError;
  });

  it('should minify HTML files', async () => {
    const content = '<div>  test  </div>';
    const outputPath = 'test.html';
    
    const result = await minify(content, outputPath);
    
    expect(result).toBe(`minified-html:${content}`);
  });

  it('should minify JS files', async () => {
    const content = 'function test() { console.log("test"); }';
    const outputPath = 'script.js';
    
    const result = await minify(content, outputPath);
    
    expect(result).toBe(`minified-js:${content}`);
  });

  it('should return content as-is for unsupported file types', async () => {
    const content = 'Some content';
    const result = await minify(content, 'styles.css');
    
    expect(result).toBe(content);
  });

  it('should return content as-is when no output path is provided', async () => {
    const content = 'Some content';
    const result = await minify(content);
    
    expect(result).toBe(content);
  });

  it('should handle case-sensitive file extensions', async () => {
    const content = '<div>test</div>';
    const outputPath = 'page.HTML';
    
    const result = await minify(content, outputPath);
    
    // The actual implementation is case-sensitive, so it won't recognize .HTML
    expect(result).toBe(content);
  });

  it('should propagate minification errors', async () => {
    // The current implementation doesn't handle errors from minification functions
    // So we expect the error to be thrown
    const error = new Error('Minification failed');
    
    // Store the original implementation
    const originalHtmlMin = (await import('../../src/utils/min-html.js')).default;
    
    try {
      // Replace the implementation for this test only
      (await import('../../src/utils/min-html.js')).default = () => {
        throw error;
      };
      
      const content = '<div>test</div>';
      const outputPath = 'test.html';
      
      // The error should be thrown since the minify function doesn't catch it
      await expect(minify(content, outputPath)).rejects.toThrow('Minification failed');
    } finally {
      // Restore the original implementation
      (await import('../../src/utils/min-html.js')).default = originalHtmlMin;
    }
  });
});

