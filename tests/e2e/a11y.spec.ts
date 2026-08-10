import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/resume/',
  '/portfolio/',
  '/portfolio/redesigning-telerik-analytics/',
  '/portfolio/evolving-binary-defense-mdr/',
  '/portfolio/employee-onboarding-at-society-of-grownups/',
  '/portfolio/organization-design-at-society-of-grownups/',
  '/portfolio/improving-telerik-product-documentation/',
  '/portfolio/lunchboat-mobile-app-interaction-flow/',
  '/portfolio/archive/bookmooch-social-networking-survey/',
  '/portfolio/archive/carnation-city-mall-blueprints/',
  '/portfolio/archive/employee-tool/',
  '/portfolio/archive/local-yokel-foods-paper-prototype/',
  '/portfolio/archive/revamping-course-registration/',
  '/portfolio/archive/society-of-grownups-website/',
  '/portfolio/archive/understanding-justcode-users/',
  '/portfolio/archive/young-professionals-of-akron-usability-study/',
  '/contact/',
];

test.describe('Accessibility (ADR-0002)', () => {
  for (const route of routes) {
    test(`${route} has no automatically detectable a11y violations`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Usability hygiene (ADR-0001)', () => {
  test('every page has a non-empty, unique title', async ({ page }) => {
    const titles = new Set();
    for (const route of routes) {
      await page.goto(route);
      const title = await page.title();
      expect(title.length, `${route} should have a non-empty title`).toBeGreaterThan(0);
      expect(
        titles.has(title),
        `${route}'s title "${title}" should be unique among tested pages`
      ).toBe(false);
      titles.add(title);
    }
  });
});
