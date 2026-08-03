import { describe, expect, it } from 'vite-plus/test';
import { parseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  it('parses flat unquoted key: value pairs and trims the body', () => {
    const raw = `---
title: Web Developer / Data Modeler
organization: FirstEnergy Corp.
start: 2007-06-04
end: 2012-09-07
---

- Did a thing.
`;
    const { data, content } = parseFrontmatter<{
      title: string;
      organization: string;
      start: string;
      end: string;
    }>(raw);
    expect(data).toEqual({
      title: 'Web Developer / Data Modeler',
      organization: 'FirstEnergy Corp.',
      start: '2007-06-04',
      end: '2012-09-07',
    });
    expect(content).toBe('- Did a thing.');
  });

  it('unwraps quoted values, keeping internal colons intact', () => {
    const raw = `---
title: 'From Red to Green and the Confusion Between: An Exploration of Color Accessibility'
---
`;
    const { data } = parseFrontmatter<{ title: string }>(raw);
    expect(data.title).toBe(
      'From Red to Green and the Confusion Between: An Exploration of Color Accessibility'
    );
  });

  it('omits keys that are absent from the frontmatter block', () => {
    const raw = `---
title: Speaking engagement
start: 2018-11-15
---
`;
    const { data } = parseFrontmatter<{ title: string; start: string; end?: string }>(raw);
    expect(data.end).toBeUndefined();
  });

  it('returns empty data and the raw content when there is no frontmatter block', () => {
    const { data, content } = parseFrontmatter('just some text');
    expect(data).toEqual({});
    expect(content).toBe('just some text');
  });
});
