// Asserts the ADR-0001 usability thresholds via the `lighthouse` CLI's Node
// API directly, per ADR-0010's rejection of @lhci/cli (low OpenSSF score,
// no commits since June 2025). There's no built-in "assert" step outside
// @lhci/cli, so this is that: run Lighthouse against each route, compare
// against the thresholds, and exit non-zero if any fail.
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4173';
const DEFAULT_ROUTES = [
  '/',
  '/resume/',
  '/portfolio/',
  '/portfolio/redesigning-telerik-analytics/',
  '/portfolio/archive/employee-tool/',
  '/portfolio/archive/society-of-grownups-website/',
  '/contact/',
];
const ROUTES = process.env.LIGHTHOUSE_ROUTES?.split(',') ?? DEFAULT_ROUTES;

const CATEGORY_THRESHOLDS = {
  performance: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
};

// INP is a field metric (real user interactions over a session) that a
// single lab-based Lighthouse run can't measure directly. Total Blocking
// Time is the standard lab proxy Lighthouse itself recommends for
// responsiveness; used here against the same 200ms threshold ADR-0001 sets
// for INP.
const METRIC_THRESHOLDS = {
  'largest-contentful-paint': { label: 'LCP', unit: 'ms', max: 2500 },
  'cumulative-layout-shift': { label: 'CLS', unit: '', max: 0.1 },
  'total-blocking-time': { label: 'TBT (INP proxy)', unit: 'ms', max: 200 },
};
function categoryThresholdsForRoute(route) {
  // Archive case studies deliberately use noindex, so Lighthouse's SEO score
  // is not meaningful for them. Their performance and usability budgets still
  // apply exactly as they do to indexable pages.
  return route.startsWith('/portfolio/archive/')
    ? Object.entries(CATEGORY_THRESHOLDS).filter(([key]) => key !== 'seo')
    : Object.entries(CATEGORY_THRESHOLDS);
}

async function auditRoute(port, route) {
  const url = `${BASE_URL}${route}`;
  const result = await lighthouse(url, {
    port,
    output: 'json',
    onlyCategories: ['performance', 'best-practices', 'seo'],
    logLevel: 'error',
  });

  const { categories, audits } = result.lhr;
  const categoriesById = new Map(Object.entries(categories));
  const auditsById = new Map(Object.entries(audits));
  let ok = true;
  console.log(`\n${route}`);

  for (const [key, threshold] of categoryThresholdsForRoute(route)) {
    const score = categoriesById.get(key)?.score ?? 0;
    const pass = score >= threshold;
    if (!pass) ok = false;
    console.log(`  ${pass ? '✔' : '✗'} ${key}: ${Math.round(score * 100)} (>= ${threshold * 100})`);
  }

  for (const [auditId, { label, unit, max }] of Object.entries(METRIC_THRESHOLDS)) {
    const value = auditsById.get(auditId)?.numericValue;
    const pass = typeof value === 'number' && value <= max;
    if (!pass) ok = false;
    console.log(`  ${pass ? '✔' : '✗'} ${label}: ${value?.toFixed(2)}${unit} (<= ${max}${unit})`);
  }

  return ok;
}

async function main() {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox'],
  });

  let allPassed = true;
  try {
    for (const route of ROUTES) {
      const passed = await auditRoute(chrome.port, route);
      allPassed = allPassed && passed;
    }
  } finally {
    await chrome.kill();
  }

  if (!allPassed) {
    console.error('\nOne or more Lighthouse thresholds were not met.');
    process.exit(1);
  }
  console.log('\nAll Lighthouse thresholds met.');
}

main();
