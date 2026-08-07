export interface RouteLcpSummary {
  route: string;
  lcpMs: number;
}

export interface LcpRegressionOptions {
  absoluteToleranceMs?: number;
  relativeTolerance?: number;
}

export interface LcpRegressionResult {
  route: string;
  baselineMs: number;
  currentMs: number;
  toleranceMs: number;
  limitMs: number;
  deltaMs: number;
  passed: boolean;
}

const DEFAULT_ABSOLUTE_TOLERANCE_MS = 250;
const DEFAULT_RELATIVE_TOLERANCE = 0.1;

function summariesByRoute(summaries: RouteLcpSummary[], label: string) {
  if (summaries.length === 0) {
    throw new Error(`${label} Lighthouse summary has no routes.`);
  }

  const byRoute = new Map<string, RouteLcpSummary>();

  for (const summary of summaries) {
    if (!summary.route.startsWith('/')) {
      throw new Error(`${label} Lighthouse summary has an invalid route: ${summary.route}`);
    }
    if (!Number.isFinite(summary.lcpMs) || summary.lcpMs < 0) {
      throw new Error(`${label} Lighthouse summary has an invalid LCP for route: ${summary.route}`);
    }
    if (byRoute.has(summary.route)) {
      throw new Error(`${label} Lighthouse summary has a duplicate route: ${summary.route}`);
    }
    byRoute.set(summary.route, summary);
  }

  return byRoute;
}

export function compareLcpRoutes(
  baseline: RouteLcpSummary[],
  current: RouteLcpSummary[],
  {
    absoluteToleranceMs = DEFAULT_ABSOLUTE_TOLERANCE_MS,
    relativeTolerance = DEFAULT_RELATIVE_TOLERANCE,
  }: LcpRegressionOptions = {}
): LcpRegressionResult[] {
  if (
    !Number.isFinite(absoluteToleranceMs) ||
    !Number.isFinite(relativeTolerance) ||
    absoluteToleranceMs < 0 ||
    relativeTolerance < 0
  ) {
    throw new Error('LCP regression tolerances must be finite and not negative.');
  }

  const baselineByRoute = summariesByRoute(baseline, 'Base');
  const currentByRoute = summariesByRoute(current, 'Current');

  for (const route of currentByRoute.keys()) {
    if (!baselineByRoute.has(route)) {
      throw new Error(`Base Lighthouse summary is missing route: ${route}`);
    }
  }
  for (const route of baselineByRoute.keys()) {
    if (!currentByRoute.has(route)) {
      throw new Error(`Current Lighthouse summary is missing route: ${route}`);
    }
  }

  return baseline.map(({ route, lcpMs: baselineMs }) => {
    const currentMs = currentByRoute.get(route)!.lcpMs;
    const toleranceMs = Math.max(absoluteToleranceMs, baselineMs * relativeTolerance);
    const limitMs = baselineMs + toleranceMs;

    return {
      route,
      baselineMs,
      currentMs,
      toleranceMs,
      limitMs,
      deltaMs: currentMs - baselineMs,
      passed: currentMs <= limitMs,
    };
  });
}
