/**
 * @file Minification transform for Eleventy
 * @description Provides a unified minification transform that delegates to
 * specific minifiers based on file extension.
 * @module utils/minify
 */

import { extname } from 'path';
import htmlmin from './min-html.js';
import jsmin from './min-js.js';

/**
 * Minifies content based on file extension
 * @async
 * @param {string} content - The file content to minify
 * @param {string} outputPath - The output file path (used to determine file type)
 * @returns {Promise<string>} The minified content, or original content if no minifier applies
 * @example
 * await minify('<html>  <body>  </body>  </html>', 'index.html')
 * // Returns: '<html><body></body></html>'
 * @description This transform is registered in .eleventy.js and automatically
 * minifies HTML and JavaScript files during the build process. CSS is minified
 * separately by the Sass plugin.
 */
const minify = async (content, outputPath) => {
  // Only minify if we have an output path
  if (outputPath) {
    const ext = extname(outputPath);

    switch (ext) {
      case '.html':
        // Minify HTML files (removes whitespace, comments, etc.)
        return htmlmin(content, outputPath);

      case '.js':
        // Minify JavaScript files (uses Terser for optimization)
        return jsmin(content, outputPath);

      default:
        // Return content unchanged for other file types
        return content;
    }
  }

  // Return content unchanged if no output path provided
  return content;
};

export default minify;
