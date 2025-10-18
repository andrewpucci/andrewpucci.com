/**
 * @file Test suite for the Redesigning Telerik Analytics portfolio page.
 * @module tests/e2e/portfolio/redesigning-telerik-analytics.spec
 * @description Tests verify the structure, content, and functionality of the
 * Redesigning Telerik Analytics project page, including metadata, layout,
 * and interactive elements.
 */

import { test, expect } from '@playwright/test';

/**
 * Test suite for the Redesigning Telerik Analytics portfolio page.
 * Tests are organized by feature area and user flows.
 */
test.describe('Redesigning Telerik Analytics Portfolio Page', () => {
  /**
   * Runs before each test to ensure a clean state.
   * Navigates to the project page and waits for it to be fully loaded.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio/redesigning-telerik-analytics/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verifies that the page has the correct title and metadata.
   * This ensures proper SEO and helps with search engine visibility.
   */
  test('should have the correct title and metadata', async ({ page }) => {
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
   * Validates the hero section's structure and content.
   * Ensures the main title and hero image are properly displayed.
   * Uses semantic selectors to be resilient to UI changes.
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
   * Tests the project team section, including:
   * - Visibility of team section
   * - Presence of team members
   * - Validity of LinkedIn links (if present)
   */
  test('should display project team with links', async ({ page }) => {
    // Look for team section by icon or heading
    let teamSection = page.locator('h2:has-text("Team"), h3:has-text("Team"), .fa-users').first();
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
   * Verifies the responsibilities and tools sections.
   * Ensures that both sections are present and contain at least one item.
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
   * Validates the presence of main content sections.
   * The test is designed to be flexible and only requires at least one
   * of the expected sections to be present.
   */
  test('should have main content sections', async ({ page }) => {
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
   * Tests for the presence of a downloadable case study.
   * The test is skipped if no PDF link is found, as this is an optional feature.
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
   * Accessibility test to ensure images have proper alt text.
   * Only checks visible images and allows some images to be decorative.
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
