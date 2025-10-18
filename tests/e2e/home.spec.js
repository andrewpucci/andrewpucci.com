// @ts-check
/**
 * @file Home page end-to-end tests
 * @description Tests for the main landing page of the portfolio website.
 * These tests verify the core functionality and content of the home page,
 * including navigation, hero section, and interactive components.
 * 
 * Test Organization:
 * - Navigation: Tests for main navigation elements and links
 * - Hero Section: Tests for the main hero content and CTAs
 * - Portfolio Carousel: Tests for the interactive portfolio showcase
 * 
 * @module tests/e2e/home.spec
 */

import { test, expect } from '@playwright/test';

/**
 * Test suite for the Home Page
 * @description Groups related tests for the home page functionality
 */
test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Debug test that logs page structure and elements
  /**
   * Debug test that logs the page structure
   * @description This test helps with debugging by logging the page's DOM structure,
   * including all links and sections. It's useful for understanding the page
   * organization during test development and debugging.
   */
  test('should log page structure', async ({ page }) => {
    await page.goto('/');
    
    // Log the page title
    const title = await page.title();
    console.log('Page Title:', title);
    
    // Log all links on the page
    const links = await page.$$eval('a', elements => 
      elements.map(el => ({
        text: el.textContent ? el.textContent.trim() : '',
        href: el.href,
        role: el.getAttribute('role') || '',
        class: el.className,
        id: el.id || ''
      }))
    );
    
    console.log('\nLinks on the page:');
    console.table(links);
    
    // Log all sections
    const sections = await page.$$eval('section, header, footer, nav, main, article, aside', 
      elements => elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        class: el.className,
        text: el.textContent && el.textContent.length > 100 ? el.textContent.substring(0, 100) + '...' : (el.textContent || '')
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
  /**
   * Verifies the page title is correct
   * @description Ensures the home page has the expected title containing the site owner's name
   */
  test('should have the correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Andrew Pucci/);
  });

  /**
   * Tests the main navigation bar for presence and expected links.
   * Ensures all primary navigation items are present and accessible.
   */
  /**
   * Validates the main navigation bar
   * @description Tests that the navigation bar is visible and contains all expected links
   * with correct href attributes. This includes testing dropdown menus and their items.
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

  /**
   * Validates the main hero section content
   * @description Ensures the hero section is visible and contains the expected
   * introduction text with the site owner's name.
   */
  test('should display the main heading with my name', async ({ page }) => {
    await page.goto('/');
    
    // Check the main heading in the first section
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
    
    // Check for the introduction text
    const introText = await mainContent.textContent();
    expect(introText).toContain('Hi, I\'m Andrew');
  });

  /**
   * Tests the portfolio carousel functionality
   * @description Verifies that the portfolio carousel is interactive, with working
   * next/previous navigation and proper item activation.
   */
  test('should have a functional portfolio carousel', async ({ page }) => {
    await page.goto('/');

    // Wait for the carousel to be visible
    const carousel = page.locator('#portfolio-overview-carousel');
    await expect(carousel, 'Portfolio carousel should be visible').toBeVisible();

    // Get all carousel items
    const carouselItems = carousel.locator('.carousel-item');
    const itemCount = await carouselItems.count();
    expect(itemCount, 'Should have at least 2 carousel items').toBeGreaterThan(1);

    // Test the next button
    const nextButton = carousel.locator('.carousel-control-next');
    await expect(nextButton, 'Next button should be visible').toBeVisible();

    // Click next and verify the second item is active
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
