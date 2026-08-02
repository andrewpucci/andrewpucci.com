import { describe, expect, it } from 'vitest';
import { pickPortfolioImage } from './portfolio-images';

describe('pickPortfolioImage', () => {
  const exampleImage = { sources: {}, img: { src: '/img/example.png', w: 100, h: 100 } } as never;

  it('returns the matching image module by filename', () => {
    const image = pickPortfolioImage(
      {
        '/src/lib/assets/img/card/example.png': { default: exampleImage },
      },
      '/img/archive/card/example.png'
    );

    expect(image).toBe(exampleImage);
  });

  it('throws when the requested image filename is missing', () => {
    expect(() => pickPortfolioImage({}, '/img/archive/card/missing.png')).toThrow(
      'No portfolio image found for "/img/archive/card/missing.png". Checked src/lib/assets/img/card/.'
    );
  });
});
