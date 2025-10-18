import { describe, it, expect } from 'vitest';
import siteData from '../../src/site/_data/site.js';

// Test the site data functionality
describe('site data', () => {
  it('should export an object with a rootUrl property', () => {
    // Check that the module exports an object with rootUrl
    expect(siteData).toBeDefined();
    expect(typeof siteData).toBe('object');
    expect(siteData).toHaveProperty('rootUrl');
  });
});
