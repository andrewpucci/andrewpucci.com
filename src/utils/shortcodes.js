const eleventyImage = require("@11ty/eleventy-img"); // See https://www.11ty.dev/docs/plugins/image/

module.exports = {

  // Perform image transformations
  image(src, alt, cls, sizes = '100vw', widths = [null]) {
    if (alt === undefined) {
      throw new Error(`Missing \`alt\` on responsive image from: ${src}`);
    }

    const options = {
      widths,
      formats: ['webp', 'jpeg'],
      urlPath: '/assets/img/',
      outputDir: './dist/assets/img/',
    };

    eleventyImage(src, options);

    let metadata = eleventyImage.statsSync(src, options);

    const lowsrc = metadata.jpeg[0];

    return `<picture>
      ${Object.values(metadata).map((imageFormat) => `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map((entry) => entry.srcset).join(', ')}" sizes="${sizes}">`).join('\n')}
        <img
          src="${lowsrc.url}"
          width="${lowsrc.width}"
          height="${lowsrc.height}"
          alt="${alt}"
          class="${cls}"
          loading="lazy"
          decoding="async">
      </picture>`;
  },

};
