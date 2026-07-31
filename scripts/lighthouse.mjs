// Asserts the ADR-0001 usability thresholds via the `lighthouse` CLI's Node
// API directly, per ADR-0010's rejection of @lhci/cli (low OpenSSF score,
// no commits since June 2025). There's no built-in "assert" step outside
// @lhci/cli, so this is that: run Lighthouse against each route, compare
// against the thresholds, and exit non-zero if any fail.
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4173';
const ROUTES = [
  '/',
  '/resume/',
  '/portfolio/',
  '/portfolio/redesigning-telerik-analytics/',
  '/contact/',
];

const CATEGORY_THRESHOLDS = [
  { key: 'performance', threshold: 0.9 },
  { key: 'best-practices', threshold: 0.9 },
  { key: 'seo', threshold: 0.9 },
];

// INP is a field metric (real user interactions over a session) that a
// single lab-based Lighthouse run can't measure directly. Total Blocking
// Time is the standard lab proxy Lighthouse itself recommends for
// responsiveness; used here against the same 200ms threshold ADR-0001 sets
// for INP.
const METRIC_THRESHOLDS = [
  { auditId: 'largest-contentful-paint', label: 'LCP', unit: 'ms', max: 2500 },
  { auditId: 'cumulative-layout-shift', label: 'CLS', unit: '', max: 0.1 },
  { auditId: 'total-blocking-time', label: 'TBT (INP proxy)', unit: 'ms', max: 200 },
];

function getCategoryScore(categories, key) {
  switch (key) {
    case 'performance':
      return categories.performance.score ?? 0;
    case 'best-practices':
      return categories['best-practices'].score ?? 0;
    case 'seo':
      return categories.seo.score ?? 0;
  }
}

function getAuditValue(audits, auditId) {
  switch (auditId) {
    case 'largest-contentful-paint':
      return audits['largest-contentful-paint']?.numericValue;
    case 'cumulative-layout-shift':
      return audits['cumulative-layout-shift']?.numericValue;
    case 'total-blocking-time':
      return audits['total-blocking-time']?.numericValue;
  }
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
  let ok = true;
  console.log(`\n${route}`);

  for (const { key, threshold } of CATEGORY_THRESHOLDS) {
    const score = getCategoryScore(categories, key);
    const pass = score >= threshold;
    if (!pass) ok = false;
    console.log(`  ${pass ? '✔' : '✗'} ${key}: ${Math.round(score * 100)} (>= ${threshold * 100})`);
  }

  for (const { auditId, label, unit, max } of METRIC_THRESHOLDS) {
    const value = getAuditValue(audits, auditId);
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
