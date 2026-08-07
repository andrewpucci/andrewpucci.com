import { readFile } from 'node:fs/promises';
import { compareLcpRoutes } from '../src/lib/utils/lighthouse-regression.ts';

const BASE_SUMMARY = process.env.LIGHTHOUSE_BASE_SUMMARY ?? 'lighthouse-reports/base/summary.json';
const CURRENT_SUMMARY =
  process.env.LIGHTHOUSE_CURRENT_SUMMARY ?? 'lighthouse-reports/current/summary.json';

async function readRoutes(filename, label) {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- Summary paths are trusted local/CI configuration values.
  const value = JSON.parse(await readFile(filename, 'utf8'));
  if (!value || !Array.isArray(value.routes)) {
    throw new Error(`${label} Lighthouse summary has no routes array: ${filename}`);
  }
  return value.routes;
}

async function main() {
  const [baseline, current] = await Promise.all([
    readRoutes(BASE_SUMMARY, 'Base'),
    readRoutes(CURRENT_SUMMARY, 'Current'),
  ]);
  const results = compareLcpRoutes(baseline, current);

  console.log('\nLCP regression comparison (five-run medians)');
  console.log('Allowed regression: 10% of the base result, with a 250ms minimum noise floor.');

  for (const result of results) {
    const direction = result.deltaMs >= 0 ? '+' : '';
    console.log(
      `  ${result.passed ? '✔' : '✗'} ${result.route}: ${result.currentMs.toFixed(0)}ms ` +
        `(base ${result.baselineMs.toFixed(0)}ms, ${direction}${result.deltaMs.toFixed(0)}ms; ` +
        `limit ${result.limitMs.toFixed(0)}ms)`
    );
  }

  if (results.some(({ passed }) => !passed)) {
    console.error('\nOne or more routes have a material LCP regression.');
    process.exit(1);
  }

  console.log('\nNo material LCP regressions found.');
}

main();
