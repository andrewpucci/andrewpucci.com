import { describe, expect, it } from 'vite-plus/test';
import { chunkItems } from './chunk-items';

describe('chunkItems', () => {
  it('defaults each item to its own page', () => {
    expect(chunkItems([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('groups items into fixed-size pages', () => {
    expect(chunkItems(['a', 'b', 'c', 'd', 'e', 'f'], 3)).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ]);
  });

  it('puts the remainder in a shorter final page', () => {
    expect(chunkItems([1, 2, 3, 4, 5, 6], 4)).toEqual([
      [1, 2, 3, 4],
      [5, 6],
    ]);
  });

  it('treats itemsPerPage < 1 as 1 rather than looping forever', () => {
    expect(chunkItems([1, 2], 0)).toEqual([[1], [2]]);
  });

  it('returns no pages for an empty item list', () => {
    expect(chunkItems([], 3)).toEqual([]);
  });
});
