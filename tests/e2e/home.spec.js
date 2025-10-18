/**
 * @file E2E tests for the home page of Andrew Pucci's portfolio website.
 * @module tests/e2e/home.spec
 * @description Tests verify the structure, content, and functionality of the
 * home page, including navigation, hero section, and key content areas.
 */

import { test, expect } from '@playwright/test';

/**
 * Test suite for the home page.
 * Tests are organized by feature area and user flows.
 */
test.describe('Home Page', () => {
  /**
   * Debug test that logs page structure and elements.
   * This test is for development purposes only and should be skipped in CI/CD.
   * It helps with understanding the page structure and debugging test issues.
   */
  test('debug - log page structure', async ({ page }) => {
    await page.goto('/');
    
    // Log the page title
    const title = await page.title();
    console.log('Page Title:', title);
    
    // Log all links on the page
    const links = await page.$$eval('a', links => 
      links.map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        role: link.getAttribute('role'),
        class: link.className,
        id: link.id
      }))
    );
    
    console.log('\nLinks on the page:');
    console.table(links);
    
    // Log all sections
    const sections = await page.$$eval('section, header, footer, nav, main, article, aside', 
      elements => elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        class: el.className,
        text: el.textContent?.trim().substring(0, 100) + (el.textContent?.length > 100 ? '...' : '')
      }))
    );
    
    console.log('\nSections on the page:');
    console.table(sections);
    
    // Take a screenshot for visual reference
    await page.screenshot({ path: 'test-results/debug-page.png' });
    
    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });
  
  /**
   * Verifies that the home page has the correct title.
   * This is a basic smoke test to ensure the page loads correctly.
   */
  test('should have the correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Andrew Pucci/);
  });

  /**
   * Tests the main navigation bar for presence and expected links.
   * Ensures all primary navigation items are present and accessible.
   */
  test('should have a navigation bar with expected links', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Scroll to the top to ensure the fixed navbar is in view
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Check if the navigation bar is visible - using a more specific selector
    const nav = page.locator('nav.navbar.navbar-expand-lg.navbar-light.fixed-top');
    await expect(nav).toBeVisible({ timeout: 10000 });
    
    // Find navigation items
    const aboutLink = page.locator('nav a:has-text("About")').first();
    const resumeLink = page.locator('a:has-text("Résumé")').first();
    const portfolioLink = page.locator('a:has-text("Portfolio")').first();
    
    // Check for specific navigation items with better error messages
    await expect(aboutLink, 'About link should be visible').toBeVisible();
    await expect(resumeLink, 'Résumé link should be visible').toBeVisible();
    await expect(portfolioLink, 'Portfolio link should be visible').toBeVisible();
    
    // Verify the links point to the correct locations
    await expect(aboutLink).toHaveAttribute('href', '/');
    await expect(resumeLink).toHaveAttribute('href', '/resume/');
    await expect(portfolioLink).toHaveAttribute('href', '#');
    
    // Verify the portfolio dropdown has items
    await portfolioLink.click();
    const dropdownItems = page.locator('.dropdown-item');
    await expect(dropdownItems).not.toHaveCount(0); // Verify there are dropdown items without hardcoding the count
  });

  test('should display the main heading with my name', async ({ page }) => {
    await page.goto('/');
    
    // Check the main heading in the first section
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
    
    // Check for the introduction text
    const introText = await mainContent.textContent();
    expect(introText).toContain('Hi, I\'m Andrew');
  });

  test('should have a functional portfolio carousel', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the carousel to be visible
    const carousel = page.locator('#portfolio-overview-carousel');
    await expect(carousel, 'Portfolio carousel should be visible').toBeVisible();
    
    // Get all carousel items
    const carouselItems = carousel.locator('.carousel-item');
    const itemCount = await carouselItems.count();
    expect(itemCount, 'Should have at least 2 carousel items').toBeGreaterThan(1);
    
    // Check that the first item is active initially
    await expect(carouselItems.first(), 'First carousel item should be active initially').toHaveClass(/active/);
    
    // Test the next button
    const nextButton = carousel.locator('.carousel-control-next');
    await expect(nextButton, 'Next button should be visible').toBeVisible();
    
    // Click next and verify the active item changes
    await nextButton.click();
    await expect(carouselItems.nth(1), 'Second carousel item should be active after clicking next').toHaveClass(/active/);
    
    // Test the previous button
    const prevButton = carousel.locator('.carousel-control-prev');
    await expect(prevButton, 'Previous button should be visible').toBeVisible();
    
    // Click previous and verify it goes back to the first item
    await prevButton.click();
    await expect(carouselItems.first(), 'First carousel item should be active after clicking previous').toHaveClass(/active/);
  });
});
