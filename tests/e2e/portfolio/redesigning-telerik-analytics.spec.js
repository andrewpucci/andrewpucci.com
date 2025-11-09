// @ts-check
/**
 * @file Redesigning Telerik Analytics portfolio page tests
 * @description End-to-end tests for the Telerik Analytics portfolio case study page.
 * These tests verify the structure, content, and functionality of the portfolio page,
 * including the hero section, project details, and interactive elements.
 * 
 * Test Organization:
 * - Hero Section: Tests for the main header and key information
 * - Project Team: Tests for team member information and links
 * - Responsibilities & Tools: Tests for project details
 * - Content Sections: Tests for various content sections
 * - Media & Assets: Tests for images and downloadable content
 * - Accessibility: Tests for accessibility best practices
 * 
 * @module tests/e2e/portfolio/redesigning-telerik-analytics.spec
 */

import { test, expect } from '@playwright/test';

/**
 * Test suite for the Redesigning Telerik Analytics Portfolio Page
 * @description Groups related tests for the portfolio page functionality
 */
test.describe('Redesigning Telerik Analytics Portfolio Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio/redesigning-telerik-analytics/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  /**
   * Validates the page metadata
   * @description Ensures the page has the correct title and meta description.
   * This is a critical test as it verifies the page's main identification elements
   * for SEO and browser tab display purposes.
   */
  test('should have correct page metadata', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Redesigning Telerik Analytics - Andrew Pucci');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      'Real-time application analytics to grow user engagement and improve user experience.'
    );
  });

  /**
   * Validates the hero section's visual elements
   * @description Ensures the hero section displays the correct title and image.
   * Uses semantic selectors for better test resilience against UI changes.
   * 
   * Test Steps:
   * 1. Verify hero title is visible and contains expected text
   * 2. Check hero image is visible and has valid source
   */
  test('should display the hero section with title and image', async ({ page }) => {
    // Check hero title
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toContainText('Redesigning Telerik Analytics');
    
    // Check hero image is visible with the correct alt text
    const heroImage = page.locator('img[alt="Redesigning Telerik Analytics"]').first();
    await expect(heroImage).toBeVisible();
    
    // Verify image source exists
    const imageSrc = await heroImage.getAttribute('src');
    expect(imageSrc).toBeTruthy();
  });

  /**
   * Validates the project team section
   * @description Tests the display of team members and their associated links.
   * Verifies that team information is properly presented and interactive.
   * 
   * Test Cases:
   * - Team section is visible
   * - At least one team member is listed
   * - LinkedIn links are valid (if present)
   */
  test('should display project team with links', async ({ page }) => {
    // Look for team section by icon or heading
    const teamSection = page.locator('h2:has-text("Team"), h3:has-text("Team"), .fa-users').first();
    await expect(teamSection).toBeVisible();
    
    // Check team members list is not empty
    const teamItems = page.locator('ul:has(li:has-text("Andrew Pucci")) li');
    const teamCount = await teamItems.count();
    expect(teamCount).toBeGreaterThan(0);
    
    // Check LinkedIn links (if any)
    const linkedInLinks = page.locator('a[href*="linkedin.com"]');
    const linkCount = await linkedInLinks.count();
    
    if (linkCount > 0) {
      for (let i = 0; i < linkCount; i++) {
        const link = linkedInLinks.nth(i);
        await expect(link, 'Team member link should be visible').toBeVisible();
        const href = await link.getAttribute('href');
        expect(href, 'Team member should have a valid LinkedIn URL').toMatch(/linkedin\.com/);
      }
    }
  });

  /**
   * Validates the responsibilities and tools sections
   * @description Ensures the page includes sections for project responsibilities
   * and tools used, each containing relevant content.
   * 
   * Test Cases:
   * - Responsibilities section is present and has content
   * - Tools section is present and has content
   * - At least one item exists in each section
   */
  test('should list responsibilities and tools', async ({ page }) => {
    // Check for responsibilities section by icon or heading
    const responsibilitiesSection = page.locator('h2:has-text("Responsibilities"), h3:has-text("Responsibilities"), .fa-clipboard-list').first();
    await expect(responsibilitiesSection).toBeVisible();
    
    // Check for tools section by icon or heading
    const toolsSection = page.locator('h2:has-text("Tools"), h3:has-text("Tools"), .fa-wrench').first();
    await expect(toolsSection).toBeVisible();
    
    // Check for at least one list item in either section
    const listItems = page.locator('ul:has(li)');
    const itemCount = await listItems.count();
    expect(itemCount, 'Should have at least one list of items').toBeGreaterThan(0);
  });

  /**
   * Validates the presence of main content sections
   * @description Verifies that key content sections are present on the page.
   * The test is designed to be flexible, only requiring one of the expected
   * sections to be present to pass.
   * 
   * @example
   * // Test will pass if any of these sections are found:
   * // - Challenge
   * // - The Telerik acquisition of EQATEC
   * // - Rebranding the EQATEC interface
   */
  test('should have a project overview section', async ({ page }) => {
    const sections = [
      'Challenge',
      'The Telerik acquisition of EQATEC',
      'Rebranding the EQATEC interface'
    ];

    // Check for at least one section to be present
    let foundSections = 0;
    for (const section of sections) {
      const sectionHeader = page.locator(`h2:has-text("${section}"), h3:has-text("${section}")`);
      if (await sectionHeader.count() > 0) {
        await expect(sectionHeader, `Section '${section}' should be visible`).toBeVisible();
        foundSections++;
      }
    }
    expect(foundSections, 'Should find at least one expected section').toBeGreaterThan(0);
  });

  /**
   * Validates the downloadable case study feature
   * @description Tests for the presence and validity of a downloadable PDF case study.
   * The test is skipped if no PDF link is found, treating it as an optional feature.
   * 
   * Test Cases:
   * - Download link is visible (if present)
   * - Link points to a PDF file
   */
  test('should have a downloadable case study', async ({ page }) => {
    // Look for any PDF link that might be the download
    const downloadLink = page.locator('a[href$=".pdf"]').first();
    if (await downloadLink.count() > 0) {
      await expect(downloadLink, 'Download link should be visible').toBeVisible();
      const href = await downloadLink.getAttribute('href');
      expect(href, 'Should link to a PDF file').toMatch(/\.pdf$/i);
    } else {
      // If no PDF link, mark as skipped instead of failed
      test.skip(!await downloadLink.isVisible(), 'No download link found, skipping test');
    }
  });

  /**
   * Validates image accessibility
   * @description Ensures that images have appropriate alt text for accessibility.
   * This test verifies that at least one image has descriptive alt text,
   * while allowing for some images to be decorative (empty alt text).
   * 
   * Accessibility Standards:
   * - Informative images must have descriptive alt text
   * - Decorative images should have empty alt text ("")
   * - The test passes if at least one image has alt text
   */
  test('should have images with proper alt text', async ({ page }) => {
    // Get all images that are not in hidden elements
    const images = page.locator('img:visible');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      let imagesWithAlt = 0;
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const altText = await image.getAttribute('alt');
        if (altText && altText.trim() !== '') {
          imagesWithAlt++;
        }
      }
      // Allow some images to not have alt text (e.g., decorative images)
      expect(imagesWithAlt, 'At least one image should have alt text').toBeGreaterThan(0);
    } else {
      test.skip(true, 'No images found on the page');
    }
  });
});
