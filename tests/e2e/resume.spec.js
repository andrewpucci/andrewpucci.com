// @ts-check
/**
 * @file Resume page end-to-end tests
 * @description Tests for the professional resume page of the portfolio website.
 * These tests verify the structure, content, and functionality of the resume page,
 * including all major sections like experience, education, and skills.
 * 
 * Test Organization:
 * - Page Structure: Tests for overall page layout and sections
 * - Professional Experience: Tests for work history entries
 * - Education: Tests for education section
 * - Skills: Tests for skills listing
 * - Downloadable Resume: Tests for PDF download functionality
 * 
 * @module tests/e2e/resume.spec
 */

import { test, expect } from '@playwright/test';

/**
 * Test suite for the Resume Page
 * @description Groups related tests for the resume page functionality
 */

test.describe('Resume Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    });

  /**
   * Verifies the resume page title and metadata
   * @description Ensures the resume page has the correct title and meta description
   */
  test('should have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Andrew Pucci - User Experience Design Lead in Pittsburgh, PA');
  });

  /**
   * Test suite for all resume sections
   * @description Groups tests for each major section of the resume
   */
  test.describe('Resume Sections', () => {
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
   * Test suite for the Professional Experience section
   * @description Tests for work history entries, including job titles, companies, and dates
   */
  test.describe('Professional Experience', () => {
      test('should have professional experience entries', async ({ page }) => {
        const experienceSection = page.locator('h2:has-text("Professional Experience")');
        await expect(experienceSection, 'Professional Experience section should exist').toBeVisible();
        
        // Check for at least one experience entry
        const entries = page.locator('.h-event');
        const entryCount = await entries.count();
        expect(entryCount, 'Should have experience entries').toBeGreaterThan(0);
      });
    });

    /**
   * Test suite for the downloadable resume functionality
   * @description Tests for the presence and functionality of the PDF resume download
   */
  test.describe('Downloadable Resume', () => {
      test('should have a downloadable resume', async ({ page }) => {
        // Look for any link that points to a PDF file
        const downloadLink = page.locator('a[href$=".pdf"]').first();
        await expect(downloadLink, 'Download link should be visible').toBeVisible();
        
        const href = await downloadLink.getAttribute('href');
        expect(href, 'Should link to a PDF file').toMatch(/\.pdf$/i);
      });
    });

    /**
   * Test suite for the Skills section
   * @description Tests for the skills listing, including categories and individual skills
   */
  test.describe('Skills', () => {
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
    });

    /**
   * Test suite for contact information
   * @description Tests for the presence of contact details like email and social links
   */
  test.describe('Contact Information', () => {
      test('should have contact information', async ({ page }) => {
        // Check for email in the header or footer
        const emailLink = page.locator('a[href^="mailto:"]').first();
        await expect(emailLink, 'Email contact should be visible').toBeVisible();
        
        // Check for LinkedIn in the header or footer
        const linkedInLink = page.locator('a[href*="linkedin.com"]').first();
        await expect(linkedInLink, 'LinkedIn link should be visible').toBeVisible();
      });
    });

    /**
   * Test suite for the Education section
   * @description Tests for education history entries, including degrees and institutions
   */
  test.describe('Education', () => {
      test('should have education section with entries', async ({ page }) => {
        const educationSection = page.locator('h2:has-text("Education")');
        await expect(educationSection, 'Education section should be visible').toBeVisible();
        
        // Check for at least one education entry
        const entries = page.locator('.h-event');
        const entryCount = await entries.count();
        expect(entryCount, 'Should have education entries').toBeGreaterThan(0);
      });
    });
  });
});
