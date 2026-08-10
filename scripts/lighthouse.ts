// Evaluates the ADR-0001 usability thresholds via the `lighthouse` CLI's Node
// API directly. ADR-0012 makes absolute LCP advisory in shared-runner CI and
// adds a same-runner base comparison; the remaining thresholds still fail
// this process directly.
import { launch } from 'chrome-launcher';
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { computeMedianRun } from 'lighthouse/core/lib/median-run.js';
import { join } from 'node:path';
import { chromium } from 'playwright';

type MetricAudit = { numericValue?: number };
type CategoryAudit = { score?: number };
type LighthouseLikeResult = {
  audits: Record<string, MetricAudit | undefined>;
};
type RouteSummary = {
  route: string;
  lcpMs: number | undefined;
};

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
const RUNS_PER_ROUTE = Number.parseInt(process.env.LIGHTHOUSE_RUNS ?? '5', 10);
const MAX_ATTEMPTS_PER_ROUTE = Number.parseInt(
  process.env.LIGHTHOUSE_MAX_ATTEMPTS ?? String(RUNS_PER_ROUTE * 2),
  10
);
const REPORT_DIR = process.env.LIGHTHOUSE_REPORT_DIR ?? 'lighthouse-reports';
const LCP_MODE = process.env.LIGHTHOUSE_LCP_MODE ?? 'error';
const THRESHOLD_MODE = process.env.LIGHTHOUSE_THRESHOLD_MODE ?? 'error';

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

async function writeReport(filename: string, value: unknown): Promise<void> {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- The report directory is a trusted local/CI configuration value.
  await writeFile(join(REPORT_DIR, filename), JSON.stringify(value));
}

function categoryThresholdsForRoute(route: string) {
  // Archive case studies deliberately use noindex, so Lighthouse's SEO score
  // is not meaningful for them. Their performance and usability budgets still
  // apply exactly as they do to indexable pages.
  return route.startsWith('/portfolio/archive/')
    ? Object.entries(CATEGORY_THRESHOLDS).filter(([key]) => key !== 'seo')
    : Object.entries(CATEGORY_THRESHOLDS);
}

function hasMedianRunInputs(lhr: LighthouseLikeResult): boolean {
  const firstContentfulPaint = lhr.audits['first-contentful-paint']?.numericValue;
  return typeof firstContentfulPaint === 'number' && Number.isFinite(firstContentfulPaint);
}

async function auditRoute(
  port: number,
  route: string
): Promise<{ ok: boolean; summary: RouteSummary }> {
  const url = `${BASE_URL}${route}`;
  const validRuns: LighthouseLikeResult[] = [];
  let attempts = 0;

  while (validRuns.length < RUNS_PER_ROUTE && attempts < MAX_ATTEMPTS_PER_ROUTE) {
    attempts += 1;
    const result = await lighthouse(url, {
      port,
      output: 'json',
      onlyCategories: ['performance', 'best-practices', 'seo'],
      logLevel: 'error',
    });
    if (!result) {
      throw new Error(`Lighthouse returned no result for ${route}.`);
    }
    const report = result.lhr as LighthouseLikeResult;

    const filename = `${route.replaceAll('/', '_') || 'home'}-attempt-${attempts}.json`;
    await writeReport(filename, report);

    if (!hasMedianRunInputs(report)) {
      console.warn(
        `Skipping incomplete Lighthouse sample for ${route} (attempt ${attempts}/${MAX_ATTEMPTS_PER_ROUTE})`
      );
      continue;
    }

    validRuns.push(report);
  }

  if (validRuns.length < RUNS_PER_ROUTE) {
    throw new Error(
      `Collected ${validRuns.length}/${RUNS_PER_ROUTE} valid Lighthouse runs for ${route} ` +
        `after ${attempts} attempts`
    );
  }

  const { categories, audits } = computeMedianRun(validRuns) as {
    categories: Record<string, CategoryAudit | undefined>;
    audits: Record<string, MetricAudit | undefined>;
  };
  const categoriesById = new Map(Object.entries(categories));
  const auditsById = new Map(Object.entries(audits));
  let ok = true;
  console.log(`\n${route} (median of ${RUNS_PER_ROUTE} valid runs from ${attempts} attempts)`);

  for (const [key, threshold] of categoryThresholdsForRoute(route)) {
    const score = categoriesById.get(key)?.score ?? 0;
    const pass = score >= threshold;
    const advisory = THRESHOLD_MODE === 'warn';
    if (!pass && !advisory) ok = false;
    console.log(
      `  ${pass ? '✔' : advisory ? '⚠' : '✗'} ${key}: ${Math.round(score * 100)} ` +
        `(>= ${threshold * 100}${advisory ? ', collection-only baseline' : ''})`
    );
  }

  for (const [auditId, { label, unit, max }] of Object.entries(METRIC_THRESHOLDS)) {
    const value = auditsById.get(auditId)?.numericValue;
    const pass = typeof value === 'number' && value <= max;
    const advisory =
      THRESHOLD_MODE === 'warn' || (auditId === 'largest-contentful-paint' && LCP_MODE === 'warn');
    if (!pass && !advisory) ok = false;
    const icon = pass ? '✔' : advisory ? '⚠' : '✗';
    const suffix =
      THRESHOLD_MODE === 'warn'
        ? ', collection-only baseline'
        : advisory
          ? ', advisory; base comparison is the CI gate'
          : '';
    console.log(`  ${icon} ${label}: ${value?.toFixed(2)}${unit} (<= ${max}${unit}${suffix})`);
  }

  return {
    ok,
    summary: {
      route,
      lcpMs: auditsById.get('largest-contentful-paint')?.numericValue,
    },
  };
}

async function main() {
  if (!Number.isInteger(RUNS_PER_ROUTE) || RUNS_PER_ROUTE < 1) {
    throw new Error('LIGHTHOUSE_RUNS must be a positive integer.');
  }
  if (!Number.isInteger(MAX_ATTEMPTS_PER_ROUTE) || MAX_ATTEMPTS_PER_ROUTE < RUNS_PER_ROUTE) {
    throw new Error('LIGHTHOUSE_MAX_ATTEMPTS must be an integer >= LIGHTHOUSE_RUNS.');
  }
  if (!['error', 'warn'].includes(LCP_MODE)) {
    throw new Error('LIGHTHOUSE_LCP_MODE must be either "error" or "warn".');
  }
  if (!['error', 'warn'].includes(THRESHOLD_MODE)) {
    throw new Error('LIGHTHOUSE_THRESHOLD_MODE must be either "error" or "warn".');
  }
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- The report directory is a trusted local/CI configuration value.
  await mkdir(REPORT_DIR, { recursive: true });

  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox'],
  });

  let allPassed = true;
  const routeSummaries: RouteSummary[] = [];
  try {
    for (const route of ROUTES) {
      const { ok, summary } = await auditRoute(chrome.port, route);
      allPassed = allPassed && ok;
      routeSummaries.push(summary);
    }
  } finally {
    await chrome.kill();
  }

  await writeReport('summary.json', {
    baseUrl: BASE_URL,
    runsPerRoute: RUNS_PER_ROUTE,
    routes: routeSummaries,
  });

  if (!allPassed) {
    console.error('\nOne or more blocking Lighthouse thresholds were not met.');
    process.exit(1);
  }
  console.log('\nAll blocking Lighthouse thresholds met.');
}

main();
