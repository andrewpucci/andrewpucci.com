// @ts-check
import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // These pages are prerendered/SSR'd; interactive tests below need
    // hydration to finish attaching event listeners before clicking anything.
    await page.waitForLoadState('networkidle');
  });

  test('has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Andrew Pucci/);
  });

  test('has a navigation bar with the expected links', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Résumé' })).toHaveAttribute('href', '/resume/');
    await expect(nav.getByText('Portfolio', { exact: true })).toBeVisible();
  });

  test('displays the hero headline', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText("Hi, I'm Andrew");
  });

  test('the skip link is the first focusable element', async ({ page, browserName }) => {
    // Safari/WebKit doesn't include links in the default Tab order unless the
    // user has "Full Keyboard Access" enabled -- a real macOS platform
    // default, not a bug in this page. Chromium and Firefox both tab to links.
    test.skip(browserName === 'webkit', 'Links are not Tab-focusable by default in Safari/WebKit');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });

  test('has an accessible, keyboard-operable portfolio carousel', async ({ page }) => {
    const carousel = page.getByRole('region', { name: 'Portfolio projects' });
    await expect(carousel).toBeVisible();

    const status = carousel.getByText(/Slide \d of \d/);
    await expect(status).toHaveText('Slide 1 of 6');

    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await expect(status).toHaveText('Slide 2 of 6');

    await carousel.getByRole('button', { name: 'Previous slide' }).click();
    await expect(status).toHaveText('Slide 1 of 6');
  });

  test('the carousel autoplay has a working pause control', async ({ page }) => {
    const carousel = page.getByRole('region', { name: 'Portfolio projects' });
    const pauseButton = carousel.getByRole('button', { name: 'Pause automatic slide rotation' });
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'true');

    await pauseButton.click();
    await expect(
      carousel.getByRole('button', { name: 'Play automatic slide rotation' })
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
