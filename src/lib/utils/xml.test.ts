import { describe, expect, it } from 'vite-plus/test';
import { escapeXml } from './xml';

describe('escapeXml', () => {
  it('escapes the 5 XML predefined entities', () => {
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('leaves ordinary URL characters untouched', () => {
    expect(escapeXml('https://andrewpucci.com/portfolio/foo-bar/')).toBe(
      'https://andrewpucci.com/portfolio/foo-bar/'
    );
  });
});
