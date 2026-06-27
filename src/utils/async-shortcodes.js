/**
 * @file Async shortcodes for Eleventy templates
 * @description Provides async shortcodes for generating responsive images, cards,
 * and expandable image modals in Eleventy templates.
 * @module utils/async-shortcodes
 */

import * as img from './image.js';

/**
 * Generates responsive image HTML with optimized sizes
 * @async
 * @param {string} imgSrc - Path to the source image
 * @param {string} imgAlt - Alt text for accessibility
 * @param {string} [imgCls=''] - CSS classes to apply to the image
 * @param {string} [imgSizes='100vw'] - Sizes attribute for responsive images
 * @param {Array<number>} [imgWidths] - Array of widths to generate
 * @returns {Promise<string>} HTML string for the responsive image
 * @example
 * await image('/assets/images/photo.jpg', 'A photo', 'img-fluid', '(max-width: 768px) 100vw, 50vw')
 * @description Uses @11ty/eleventy-img to generate optimized, responsive images
 * with multiple sizes and formats (WebP, JPEG).
 */
export const image = async (imgSrc, imgAlt, imgCls, imgSizes, imgWidths) =>
  img.image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths);

/**
 * Generates a Bootstrap card component with an image
 * @async
 * @param {string} cardTitle - Title text for the card
 * @param {string} cardContent - Body content for the card
 * @param {string} cardURL - URL for the card link
 * @param {string} imgSrc - Path to the card image
 * @param {string} imgAlt - Alt text for the card image
 * @param {string} [imgCls=''] - CSS classes for the image
 * @param {string} [imgSizes='100vw'] - Sizes attribute for responsive images
 * @param {Array<number>} [imgWidths] - Array of widths to generate
 * @returns {Promise<string>} HTML string for the Bootstrap card
 * @example
 * await card(
 *   'Project Title',
 *   'Brief description',
 *   '/portfolio/project',
 *   '/assets/images/project.jpg',
 *   'Project screenshot'
 * )
 * @description Creates a Bootstrap 5 card with a responsive image, title, content,
 * and a "Read more" link with a stretched-link for the entire card to be clickable.
 */
export const card = async (
  cardTitle,
  cardContent,
  cardURL,
  imgSrc,
  imgAlt,
  imgCls,
  imgSizes,
  imgWidths
) => {
  // Generate optimized responsive image for the card
  const cardImg = await img.image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths);

  return `<div class="card">
    ${cardImg}
    <div class="card-body">
      <p class="h5 card-title">${cardTitle}</p>
      <p class="card-text">${cardContent}</p>
    </div>
    <div class="card-footer bg-white border-top-0">
      <a href="${cardURL}" class="card-link stretched-link" aria-label="Read more about ${cardTitle}">Read more</a>
    </div>
  </div>`;
};

/**
 * Generates an expandable image with a Bootstrap modal for full-size viewing
 * @async
 * @param {string} imgName - Unique identifier for the modal (used for IDs)
 * @param {string} imgSrc - Path to the source image
 * @param {string} imgAlt - Alt text for accessibility
 * @returns {Promise<string>} HTML string for the thumbnail and modal
 * @example
 * await expandableImage('screenshot-1', '/assets/images/large.jpg', 'Application screenshot')
 * @description Creates a thumbnail image that opens a Bootstrap modal with the full-size
 * image when clicked. The thumbnail is optimized for performance, while the modal shows
 * the full-resolution image.
 */
export const expandableImage = async (imgName, imgSrc, imgAlt) => {
  // Generate thumbnail image (optimized for quick loading)
  const thumbImage = await img.image(imgSrc, imgAlt, 'img-fluid img-thumbnail', '629', [
    629,
    1258,
    null,
  ]);

  // Generate full-size image for modal (higher quality)
  const fullImage = await img.image(imgSrc, '', 'img-fluid');

  return `<a href="#${imgName}-modal" data-bs-toggle="modal">
      ${thumbImage}
    </a>
    <div class="modal fade" id="${imgName}-modal" tabindex="-1" aria-labelledby="${imgName}-modal-title" aria-hidden="true">
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${imgName}-modal-title">${imgAlt}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${fullImage}
          </div>
        </div>
      </div>
    </div>`;
};

// For backward compatibility
export default {
  image,
  card,
  expandableImage,
};
