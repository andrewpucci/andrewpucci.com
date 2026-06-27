/**
 * @file Eleventy configuration
 * @description Main configuration file for the Eleventy static site generator.
 * Configures plugins, filters, shortcodes, collections, and build settings.
 * @see {@link https://www.11ty.dev/docs/config/|Eleventy Configuration}
 */

import pluginRev from 'eleventy-plugin-rev';
import eleventySass from 'eleventy-sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { dateToFormat, obfuscate, stripSpaces, stripProtocol } from './src/utils/filters.js';
import { image, card, expandableImage } from './src/utils/async-shortcodes.js';
import minify from './src/utils/minify.js';

/**
 * Eleventy configuration function
 * @param {Object} eleventyConfig - The Eleventy configuration object
 * @returns {Object} Configuration options for Eleventy
 */
export default function (eleventyConfig) {
  // Add revisioning plugin for cache busting
  // Adds unique hashes to asset filenames to prevent stale caches
  eleventyConfig.addPlugin(pluginRev);

  // Configure and add Sass plugin for stylesheet processing
  // Compiles Sass to CSS, adds vendor prefixes, and minifies output
  eleventyConfig.addPlugin(eleventySass, {
    sass: {
      loadPaths: ['node_modules'], // Allow importing from node_modules (e.g., Bootstrap)
      style: 'compressed', // Minify CSS output
      sourceMap: true, // Generate source maps for debugging
      quietDeps: true, // Suppress deprecation warnings from dependencies
      silenceDeprecations: ['import'], // Keep current @import setup without log spam
    },
    postcss: postcss([
      autoprefixer(), // Add vendor prefixes for browser compatibility
      cssnano({ preset: 'default' }), // Further optimize and minify CSS
    ]),
    rev: true, // Enable asset revisioning for cache busting
  });

  // Register custom filters for use in templates
  eleventyConfig.addFilter('dateToFormat', dateToFormat); // Format dates with Luxon
  eleventyConfig.addFilter('obfuscate', obfuscate); // Obfuscate strings (e.g., emails)
  eleventyConfig.addFilter('stripSpaces', stripSpaces); // Remove all whitespace
  eleventyConfig.addFilter('stripProtocol', stripProtocol); // Remove protocol from URLs

  // Register async shortcodes for use in Nunjucks templates
  eleventyConfig.addNunjucksAsyncShortcode('image', image); // Responsive images
  eleventyConfig.addNunjucksAsyncShortcode('card', card); // Bootstrap cards
  eleventyConfig.addNunjucksAsyncShortcode('expandableImage', expandableImage); // Modal images

  // Create collections for resume entries
  // Collections group related content for easy iteration in templates
  const collections = ['work', 'education', 'speaking', 'volunteering'];
  collections.forEach((name) => {
    eleventyConfig.addCollection(name, function (collection) {
      // Match files in the collection's folder
      // Create a simple string check instead of regex for better security
      const inEntryFolder = (item) => {
        const pathParts = item.inputPath.split('/');
        return pathParts.includes(name);
      };

      // Sort entries by start date (oldest first)
      const byStartDate = (a, b) => {
        if (a.data.start && b.data.start) {
          return a.data.start - b.data.start;
        }
        return 0;
      };

      return collection.getAllSorted().filter(inEntryFolder).sort(byStartDate);
    });
  });

  // Add minification transform for HTML and JavaScript
  // This runs after templates are rendered but before files are written
  eleventyConfig.addTransform('minify', minify);

  // Copy static assets directly to output without processing
  eleventyConfig.addPassthroughCopy('./src/site/assets/files/*'); // PDFs, documents
  eleventyConfig.addPassthroughCopy('./src/site/assets/fonts/*.woff*'); // Web fonts
  eleventyConfig.addPassthroughCopy('./src/site/assets/favicon-32x32.png'); // Favicon
  eleventyConfig.addPassthroughCopy('./src/site/humans.txt'); // humans.txt
  eleventyConfig.addPassthroughCopy('./src/site/robots.txt'); // robots.txt

  return {
    dir: {
      input: 'src/site',
      layouts: '_layouts',
      output: 'dist',
      data: '_data',
    },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}
