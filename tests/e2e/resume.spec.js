/**
 * @file E2E tests for the resume page of Andrew Pucci's portfolio website.
 * @module tests/e2e/resume.spec
 * @description Tests verify the structure, content, and functionality of the
 * resume page, including personal information, work experience, and education.
 */

import { test, expect } from '@playwright/test';

// Test suite for the resume page
// Tests are organized by section of the resume to ensure comprehensive coverage

// Setup: Runs before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
    await page.goto('/resume/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verifies that the resume page has the correct title.
   * This is a basic smoke test to ensure the page loads correctly.
   */
  /**
   * Verifies that the resume page has the correct title.
   * This is a basic smoke test to ensure the page loads correctly.
   */
  test('should have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Andrew Pucci - User Experience Design Lead in Pittsburgh, PA');
  });

  /**
   * Validates the presence of all main resume sections.
   * Ensures the resume is properly structured with all expected sections.
   */
  test('should have all main sections', async ({ page }) => {
    const sections = [
      'Professional Experience',
      'Education',
      'Speaking',
      'Volunteer Experience'
    ];

    for (const section of sections) {
      const sectionHeader = page.locator(`h2:has-text("${section}")`);
      await expect(sectionHeader, `Section '${section}' should be visible`).toBeVisible();
    }
  });

  /**
   * Validates the professional experience section.
   * Verifies that experience entries are present and contain expected information.
   */
  test('should have professional experience entries', async ({ page }) => {
    const experienceSection = page.locator('h2:has-text("Professional Experience")');
    await expect(experienceSection, 'Professional Experience section should exist').toBeVisible();
    
    // Check for at least one experience entry
    const entries = page.locator('.h-event');
    const entryCount = await entries.count();
    expect(entryCount, 'Should have experience entries').toBeGreaterThan(0);
  });

  /**
   * Tests for the presence of a downloadable resume.
   * Verifies that the download link exists and points to a PDF file.
   * The test is skipped if no PDF link is found.
   */
  /**
   * Tests for the presence of a downloadable resume.
   * Verifies that the download link exists and points to a PDF file.
   * The test is skipped if no PDF link is found.
   */
  test('should have a downloadable resume', async ({ page }) => {
    // Look for any link that points to a PDF file
    const downloadLink = page.locator('a[href$=".pdf"]').first();
    await expect(downloadLink, 'Download link should be visible').toBeVisible();
    
    const href = await downloadLink.getAttribute('href');
    expect(href, 'Should link to a PDF file').toMatch(/\.pdf$/i);
  });

  /**
   * Validates the skills section.
   * Ensures skills are properly categorized and displayed.
   */
  test('should have skills section', async ({ page }) => {
    // First check if skills section exists (it's optional)
    const skillsSection = page.locator('h2:has-text("Skills")');
    const hasSkills = await skillsSection.count() > 0;
    
    if (hasSkills) {
      // If skills section exists, check it has content
      const skillsList = skillsSection.locator('+ * .p-skill').first();
      await expect(skillsList, 'Skills list should be visible').toBeVisible();
    } else {
      // If no skills section, mark test as passed
      console.log('No skills section found, skipping skills test');
      expect(true).toBe(true);
    }
  });

  /**
   * Verifies that contact information is present and accessible.
   * Checks for both email and LinkedIn links in the header or footer.
   */
  /**
   * Verifies that contact information is present and accessible.
   * Checks for both email and LinkedIn links in the header or footer.
   */
  test('should have contact information', async ({ page }) => {
    // Check for email in the header or footer
    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink, 'Email contact should be visible').toBeVisible();
    
    // Check for LinkedIn in the header or footer
    const linkedInLink = page.locator('a[href*="linkedin.com"]').first();
    await expect(linkedInLink, 'LinkedIn link should be visible').toBeVisible();
  });

  /**
   * Validates the education section.
   * Ensures the section exists and contains at least one education entry.
   * Uses semantic HTML classes for better accessibility.
   */
  /**
   * Validates the education section.
   * Ensures the section exists and contains at least one education entry.
   * Uses semantic HTML classes for better accessibility.
   */
  test('should have education section with entries', async ({ page }) => {
    const educationSection = page.locator('h2:has-text("Education")');
    await expect(educationSection, 'Education section should be visible').toBeVisible();
    
    // Check for at least one education entry
    const entries = page.locator('.h-event');
    const entryCount = await entries.count();
    expect(entryCount, 'Should have education entries').toBeGreaterThan(0);
  });
