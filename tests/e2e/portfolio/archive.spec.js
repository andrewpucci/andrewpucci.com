// @ts-check
import { expect, test } from '@playwright/test';

const archiveSlugs = [
  'bookmooch-social-networking-survey',
  'carnation-city-mall-blueprints',
  'employee-tool',
  'local-yokel-foods-paper-prototype',
  'revamping-course-registration',
  'society-of-grownups-website',
  'understanding-justcode-users',
  'young-professionals-of-akron-usability-study',
];

test.describe('Archived portfolio pages', () => {
  test('publishes each archive entry with a noindex directive', async ({ request }) => {
    for (const slug of archiveSlugs) {
      const response = await request.get(`/portfolio/archive/${slug}/`);

      expect(response.ok(), `${slug} should be reachable`).toBe(true);

      const html = await response.text();
      expect(html).toContain('<meta name="robots" content="noindex"');
    }
  });

  test('keeps archive entries out of primary discovery surfaces', async ({ page, request }) => {
    await page.goto('/portfolio/');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('link', { name: 'BookMooch Social Networking Survey' })
    ).toHaveCount(0);
    await expect(page.locator('a[href^="/portfolio/archive/"]')).toHaveCount(0);

    const archiveIndexResponse = await request.get('/portfolio/archive/');
    expect(archiveIndexResponse.status()).toBe(404);

    const sitemapResponse = await request.get('/sitemap.xml');
    if (sitemapResponse.ok()) {
      expect(await sitemapResponse.text()).not.toContain('/portfolio/archive/');
    } else {
      expect(sitemapResponse.status()).toBe(404);
    }
  });

  test('renders migrated archive media and converted legacy embeds', async ({ page }) => {
    await page.goto('/portfolio/archive/employee-tool/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Society of Grownups Employee Tool'
    );
    await expect(page.locator('.archive-body img')).toHaveCount(5);

    await page.goto('/portfolio/archive/carnation-city-mall-blueprints/');
    await expect(
      page.getByRole('link', { name: 'View Carnation City Mall website redesign presentation' })
    ).toBeVisible();
  });
});
