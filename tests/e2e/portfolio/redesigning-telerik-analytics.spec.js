// @ts-check
import { expect, test } from '@playwright/test';

test.describe('Redesigning Telerik Analytics case study', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio/redesigning-telerik-analytics/');
    await page.waitForLoadState('networkidle');
  });

  test('has correct page metadata', async ({ page }) => {
    await expect(page).toHaveTitle('Redesigning Telerik Analytics - Andrew Pucci');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Real-time application analytics to grow user engagement and improve user experience.'
    );
  });

  test('displays the hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Redesigning Telerik Analytics'
    );
  });

  test('lists project team, responsibilities, and tools', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Project Team' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Responsibilities' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tools Used' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Thomas Høst Andersen (lead developer)' })
    ).toHaveAttribute('href', /linkedin\.com/);
  });

  test('has a downloadable case study PDF', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      '/files/redesigning-telerik-analytics.pdf'
    );
  });

  test('has an accessible expandable image', async ({ page }) => {
    const trigger = page.getByRole('button', {
      name: /Screenshot of the Silverlight EQATEC interface/,
    });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
