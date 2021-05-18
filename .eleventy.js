const Image = require("@11ty/eleventy-img"); // See https://www.11ty.dev/docs/plugins/image/

async function imageShortcode(src, alt, cls, sizes = "100vw", widths = [null]) {
  if(alt === undefined) {
    throw new Error(`Missing \`alt\` on responsiveimage from: ${src}`);
  }

  let metadata = await Image(src, {
    widths: widths,
    formats: ['webp', 'jpeg'],
    urlPath: "/assets/img/",
    outputDir: "./dist/assets/img/",
  });

  let lowsrc = metadata.jpeg[0];

  return `<picture>
    ${Object.values(metadata).map(imageFormat => {
      return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map(entry => entry.srcset).join(", ")}" sizes="${sizes}">`;
    }).join("\n")}
      <img
        src="${lowsrc.url}"
        width="${lowsrc.width}"
        height="${lowsrc.height}"
        alt="${alt}"
        class="${cls}"
        loading="lazy"
        decoding="async">
    </picture>`;
}

module.exports = function(config) {
  // Add some utility filters
  config.addFilter('squash', require('./src/filters/squash.js') );

  // Minify the HTML output
  config.addTransform('htmlmin', require('./src/utils/minify-html.js'));

  // Pass some assets right through
  config.addPassthroughCopy('./src/site/assets');
  config.addPassthroughCopy('./src/site/humans.txt');
  config.addPassthroughCopy('./src/site/robots.txt');

  // Perform image transformations
  config.addNunjucksAsyncShortcode("image", imageShortcode);

  return {
    dir: {
      input: 'src/site',
      layouts: '_layouts',
      output: 'dist',
      data: '_data',
    },
    templateFormats : ['njk', 'md'],
    htmlTemplateEngine : 'njk',
    markdownTemplateEngine : 'njk',
  };
};
