import { describe, expect, it } from 'vite-plus/test';
import { compareLcpRoutes } from './lighthouse-regression';

describe('compareLcpRoutes', () => {
  it('uses a 250ms noise floor when ten percent of the baseline is smaller', () => {
    const [result] = compareLcpRoutes([{ route: '/', lcpMs: 1500 }], [{ route: '/', lcpMs: 1750 }]);

    expect(result).toMatchObject({
      route: '/',
      baselineMs: 1500,
      currentMs: 1750,
      toleranceMs: 250,
      passed: true,
    });
  });

  it('uses a ten-percent tolerance when it is larger than the noise floor', () => {
    const [result] = compareLcpRoutes([{ route: '/', lcpMs: 3000 }], [{ route: '/', lcpMs: 3301 }]);

    expect(result).toMatchObject({
      toleranceMs: 300,
      limitMs: 3300,
      deltaMs: 301,
      passed: false,
    });
  });

  it('compares routes by name rather than report order', () => {
    const results = compareLcpRoutes(
      [
        { route: '/', lcpMs: 2000 },
        { route: '/contact/', lcpMs: 1800 },
      ],
      [
        { route: '/contact/', lcpMs: 1750 },
        { route: '/', lcpMs: 2050 },
      ]
    );

    expect(results.map(({ route, passed }) => ({ route, passed }))).toEqual([
      { route: '/', passed: true },
      { route: '/contact/', passed: true },
    ]);
  });

  it('rejects a comparison when the base report is missing a current route', () => {
    expect(() =>
      compareLcpRoutes(
        [{ route: '/', lcpMs: 2000 }],
        [
          { route: '/', lcpMs: 2050 },
          { route: '/contact/', lcpMs: 1800 },
        ]
      )
    ).toThrow('Base Lighthouse summary is missing route: /contact/');
  });

  it('rejects empty summaries instead of treating missing measurements as a pass', () => {
    expect(() => compareLcpRoutes([], [])).toThrow('Base Lighthouse summary has no routes.');
  });

  it('rejects non-finite regression tolerances', () => {
    expect(() =>
      compareLcpRoutes([{ route: '/', lcpMs: 2000 }], [{ route: '/', lcpMs: 2050 }], {
        relativeTolerance: Number.NaN,
      })
    ).toThrow('LCP regression tolerances must be finite and not negative.');
  });
});
