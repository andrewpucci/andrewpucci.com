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

  test('shows one more-projects card per page on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/portfolio/redesigning-telerik-analytics/');
    await page.waitForLoadState('networkidle');

    const carousel = page.getByRole('region', { name: 'Other portfolio projects' });
    await expect(carousel.getByText(/Slide \d of \d/)).toHaveText('Slide 1 of 5');
  });

  test('shows two more-projects cards per page on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/portfolio/redesigning-telerik-analytics/');
    await page.waitForLoadState('networkidle');

    const carousel = page.getByRole('region', { name: 'Other portfolio projects' });
    await expect(carousel.getByText(/Slide \d of \d/)).toHaveText('Slide 1 of 3');
  });

  test('shows three more-projects cards per page on desktop', async ({ page }) => {
    const carousel = page.getByRole('region', { name: 'Other portfolio projects' });
    await expect(carousel.getByText(/Slide \d of \d/)).toHaveText('Slide 1 of 2');
  });

  test('has an accessible expandable image', async ({ page }) => {
    const trigger = page.getByRole('button', {
      name: /Screenshot of the Silverlight EQATEC interface/,
    });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const closeButton = page.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
