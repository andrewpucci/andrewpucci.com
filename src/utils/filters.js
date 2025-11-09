/**
 * @file Custom Eleventy filters for data transformation
 * @description Provides utility filters for formatting dates, obfuscating strings,
 * and manipulating text content in Eleventy templates.
 * @module utils/filters
 */

import { DateTime } from 'luxon';

/**
 * Formats a JavaScript Date object to a specified format string
 * @param {Date} date - The date to format
 * @param {string} format - The format string (e.g., 'MM/DD/YYYY', 'MMMM DD, YYYY')
 * @returns {string} The formatted date string
 * @example
 * dateToFormat(new Date('2024-01-15'), 'MM/DD/YYYY')
 * // Returns: '01/15/2024'
 * @see {@link https://moment.github.io/luxon/#/formatting|Luxon formatting tokens}
 */
export const dateToFormat = (date, format) => {
  try {
    // If date is not a valid date, try to create a date from it
    const dateObj = date instanceof Date && !isNaN(date) ? date : new Date(date);
    
    // Check if the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'Invalid DateTime';
    }
    
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(String(format));
  } catch {
    return 'Invalid DateTime';
  }
};

/**
 * Obfuscates a string by converting each character to its HTML entity code
 * @param {string} str - The string to obfuscate
 * @returns {string} The obfuscated string with HTML entities
 * @example
 * obfuscate('email@example.com')
 * // Returns: '&#101;&#109;&#97;&#105;&#108;&#64;&#101;&#120;&#97;&#109;&#112;&#108;&#101;&#46;&#99;&#111;&#109;'
 * @description Useful for protecting email addresses from spam bots while keeping them
 * readable by browsers. The browser will decode the entities back to the original text.
 */
export const obfuscate = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  const chars = [];
  // Use a for...of loop to safely iterate over string characters
  for (const char of str) {
    // Get the code point of the first character
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) {
      chars.push(`&#${codePoint};`);
    }
  }
  return chars.join('');
};

/**
 * Removes all whitespace characters from a string
 * @param {string} str - The string to process
 * @returns {string} The string with all spaces removed
 * @example
 * stripSpaces('Hello World')
 * // Returns: 'HelloWorld'
 * @description Removes spaces, tabs, newlines, and other whitespace characters.
 * Useful for creating IDs or class names from user-provided text.
 */
export const stripSpaces = (str) => str.replace(/\s/g, '');

/**
 * Removes the protocol (http://, https://, etc.) from a URL
 * @param {string} str - The URL string to process
 * @returns {string} The URL without the protocol
 * @example
 * stripProtocol('https://example.com/path')
 * // Returns: 'example.com/path'
 * @description Useful for displaying URLs in a cleaner format or for
 * protocol-relative URLs. Handles both http and https protocols.
 */
export const stripProtocol = (str) => str.replace(/(^\w+:|^)\/\//, '');

// For backward compatibility
export default {
  dateToFormat,
  obfuscate,
  stripSpaces,
  stripProtocol
};
