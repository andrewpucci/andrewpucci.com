const pluginRev = require('eleventy-plugin-rev');
const eleventySass = require('eleventy-sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const filters = require('./src/utils/filters.js');
const asyncShortcodes = require('./src/utils/async-shortcodes.js');

module.exports = function(eleventyConfig) {

  eleventyConfig.addPlugin(pluginRev);
  eleventyConfig.addPlugin(eleventySass, {
    sass: {
      style: 'compressed',
      sourceMap: true
    },
    postcss: postcss([autoprefixer, cssnano]),
    rev: true,
  });

  // Add utility filters
  Object.keys(filters).forEach((filterName) => {
    eleventyConfig.addFilter(filterName, filters[filterName]);
  });

  // Add async shortcodes
  Object.keys(asyncShortcodes).forEach((shortcodeName) => {
    eleventyConfig.addNunjucksAsyncShortcode(shortcodeName, asyncShortcodes[shortcodeName]);
  });

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

  // Minify the HTML output
  eleventyConfig.addTransform('minify', require('./src/utils/minify.js'));

  // Pass some assets right through
  eleventyConfig.addPassthroughCopy('./src/site/assets/files/*');
  eleventyConfig.addPassthroughCopy('./src/site/assets/fonts/*.woff*');
  eleventyConfig.addPassthroughCopy('./src/site/humans.txt');
  eleventyConfig.addPassthroughCopy('./src/site/robots.txt');

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
