/** Groups items into fixed-size pages, remainder in a shorter final page. */
export function chunkItems<T>(items: T[], itemsPerPage: number): T[][] {
  const size = Math.max(1, itemsPerPage);
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}
