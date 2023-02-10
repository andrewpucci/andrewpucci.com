const filters = require('./src/utils/filters.js');
const asyncShortcodes = require('./src/utils/async-shortcodes.js');

module.exports = function(eleventyConfig) {

  // Use .eleventyignore instead of .gitignore to specify what should be ignored by Eleventy processing
  eleventyConfig.setUseGitIgnore(false);

  // Add utility filters
  Object.keys(filters).forEach((filterName) => {
    eleventyConfig.addFilter(filterName, filters[filterName]);
  });

  // Add async shortcodes
  Object.keys(asyncShortcodes).forEach((shortcodeName) => {
    eleventyConfig.addNunjucksAsyncShortcode(shortcodeName, asyncShortcodes[shortcodeName]);
  });

  // Minify the HTML output
  eleventyConfig.addTransform('htmlmin', require('./src/utils/minify-html.js'));

  // Collections
  const collections = ['work', 'education', 'speaking', 'volunteering'];
  collections.forEach((name) => {
    eleventyConfig.addCollection(name, function (collection) {
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
  eleventyConfig.addPassthroughCopy('./src/site/assets');
  eleventyConfig.addPassthroughCopy('./src/site/humans.txt');
  eleventyConfig.addPassthroughCopy('./src/site/robots.txt');

  // Watch for SCSS changes to pass through
  eleventyConfig.addWatchTarget("./src/site/assets/css");
  eleventyConfig.addWatchTarget("./src/site/assets/js");

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
