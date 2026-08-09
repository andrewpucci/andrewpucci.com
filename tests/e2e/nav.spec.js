// @ts-check
import { expect, test } from '@playwright/test';

test.describe('Primary navigation', () => {
  test('shows the Portfolio dropdown links on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    const portfolioTrigger = nav.getByRole('button', { name: 'Portfolio' });

    await expect(portfolioTrigger).toBeVisible();
    await portfolioTrigger.click();

    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'Overview' })).toBeVisible();
    await expect(
      menu.getByRole('menuitem', { name: 'Redesigning Telerik Analytics' })
    ).toBeVisible();
  });

  test('supports a nested mobile Portfolio submenu with keyboard navigation', async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    const navToggle = nav.getByRole('button', { name: 'Toggle navigation' });

    await navToggle.focus();
    await expect(navToggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(navToggle).toHaveAttribute('aria-expanded', 'true');

    const portfolioTrigger = nav.getByRole('button', { name: 'Portfolio' });
    await portfolioTrigger.focus();
    await expect(portfolioTrigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(portfolioTrigger).toHaveAttribute('aria-expanded', 'true');

    const overviewLink = nav.getByRole('link', { name: 'Overview' });
    await expect(overviewLink).toBeVisible();
    test.skip(browserName === 'webkit', 'Links are not Tab-focusable by default in Safari/WebKit');
    await page.keyboard.press('Tab');
    await expect(overviewLink).toBeFocused();
  });

  test('hides the mobile toggle and shows the desktop links at desktop widths', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: 'Primary' });

    await expect(nav.getByRole('button', { name: 'Toggle navigation' })).not.toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Portfolio' })).toBeVisible();
  });
});
