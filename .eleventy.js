const Image = require("@11ty/eleventy-img"); // See https://www.11ty.dev/docs/plugins/image/
const filters = require('./src/utils/filters.js');

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

  // Use .eleventyignore instead of .gitignore to specify what should be ignored by Eleventy processing
  config.setUseGitIgnore(false);

  // Add some utility filters
  Object.keys(filters).forEach((filterName) => {
    config.addFilter(filterName, filters[filterName]);
  });

  // Minify the HTML output
  config.addTransform('htmlmin', require('./src/utils/minify-html.js'));

  // Collections
  const collections = ['work', 'education', 'speaking', 'volunteering'];
  collections.forEach((name) => {
    config.addCollection(name, function (collection) {
      const folderRegex = new RegExp(`\/${name}\/`);
      const inEntryFolder = (item) => item.inputPath.match(folderRegex) !== null;

      const byStartDate = (a, b) => {
        if (a.data.start && b.data.start) {
          return a.data.start - b.data.start;
        }
        return 0;
      };

      return collection
        .getAllSorted()
        .filter(inEntryFolder)
        .sort(byStartDate);
    });
  });

  // Pass some assets right through
  config.addPassthroughCopy('./src/site/assets');
  config.addPassthroughCopy('./src/site/humans.txt');
  config.addPassthroughCopy('./src/site/robots.txt');

  // Perform image transformations
  config.addNunjucksAsyncShortcode("image", imageShortcode);

  // Watch for SCSS changes to pass through
  config.addWatchTarget("./src/site/assets/css");
  config.addWatchTarget("./src/site/assets/js");

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
