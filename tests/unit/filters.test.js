import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dateToFormat, obfuscate, stripSpaces, stripProtocol } from '../../src/utils/filters.js';

describe('filters', () => {
  describe('dateToFormat', () => {
    it('should format date according to the specified format', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      expect(dateToFormat(date, 'yyyy')).toBe('2023');
      expect(dateToFormat(date, 'MM/dd/yyyy')).toBe('01/01/2023');
    });

    it('should handle invalid dates', () => {
      expect(dateToFormat('not-a-date', 'yyyy')).toBe('Invalid DateTime');
    });
  });

  describe('obfuscate', () => {
    it('should obfuscate a string by converting characters to HTML entities', () => {
      expect(obfuscate('test@example.com')).toMatch(/^(&#\d+;)+$/);
      expect(obfuscate('test@example.com')).toContain('&#116;'); // 't' in ASCII
    });

    it('should handle empty strings', () => {
      expect(obfuscate('')).toBe('');
    });
  });

  describe('stripSpaces', () => {
    it('should remove all whitespace from a string', () => {
      expect(stripSpaces('  test  string  ')).toBe('teststring');
      expect(stripSpaces('no-spaces-here')).toBe('no-spaces-here');
    });

    it('should handle empty strings', () => {
      expect(stripSpaces('')).toBe('');
    });
  });

  describe('stripProtocol', () => {
    it('should remove http:// or https:// from URLs', () => {
      expect(stripProtocol('https://example.com')).toBe('example.com');
      expect(stripProtocol('http://example.com')).toBe('example.com');
      expect(stripProtocol('//example.com')).toBe('example.com');
    });

    it('should return the original string if no protocol is present', () => {
      expect(stripProtocol('example.com')).toBe('example.com');
      expect(stripProtocol('')).toBe('');
    });
  });
});
