import { describe, it, expect, vi, beforeEach } from 'vitest';
import { image, card, expandableImage } from '../../src/utils/async-shortcodes.js';
import * as imgUtils from '../../src/utils/image.js';

// Mock the image module
vi.mock('../../src/utils/image.js', () => ({
  image: vi.fn().mockResolvedValue('<img src="mocked.jpg" alt="mocked">')
}));

describe('async-shortcodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('image', () => {
    it('should call the image utility with provided parameters', async () => {
      const result = await image('test.jpg', 'test alt', 'test-class', '100vw', [100, 200]);
      expect(imgUtils.image).toHaveBeenCalledWith(
        'test.jpg',
        'test alt',
        'test-class',
        '100vw',
        [100, 200]
      );
      expect(result).toBe('<img src="mocked.jpg" alt="mocked">');
    });
  });

  describe('card', () => {
    it('should generate a card with the provided content', async () => {
      const result = await card(
        'Test Title',
        'Test content',
        '/test-url',
        'test.jpg',
        'Test image',
        'card-img',
        '100vw',
        [100, 200]
      );

      expect(imgUtils.image).toHaveBeenCalledWith(
        'test.jpg',
        'Test image',
        'card-img',
        '100vw',
        [100, 200]
      );
      
      expect(result).toContain('Test Title');
      expect(result).toContain('Test content');
      expect(result).toContain('href="/test-url"');
      expect(result).toContain('Read more about Test Title');
    });
  });

  describe('expandableImage', () => {
    it('should generate an expandable image component', async () => {
      const result = await expandableImage('test', 'test.jpg', 'Test image');
      
      // Should call image twice - once for thumbnail, once for full image
      expect(imgUtils.image).toHaveBeenCalledTimes(2);
      
      // Check for modal structure
      expect(result).toContain('data-bs-toggle="modal"');
      expect(result).toContain('id="test-modal"');
      expect(result).toContain('modal-fullscreen');
      
      // Should include the alt text in the modal title
      expect(result).toContain('Test image');
    });
  });
});
