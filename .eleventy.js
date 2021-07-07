const filters = require('./src/utils/filters.js');
const shortcodes = require('./src/utils/shortcodes.js');
const pairedShortcodes = require('./src/utils/paired-shortcodes.js');

module.exports = function(config) {

  // Use .eleventyignore instead of .gitignore to specify what should be ignored by Eleventy processing
  config.setUseGitIgnore(false);

  // Add utility filters
  Object.keys(filters).forEach((filterName) => {
    config.addFilter(filterName, filters[filterName]);
  });

  // Add shortcodes
  Object.keys(shortcodes).forEach((shortcodeName) => {
    config.addNunjucksShortcode(shortcodeName, shortcodes[shortcodeName]);
  });

  // Add paired shortcodes
  Object.keys(pairedShortcodes).forEach((shortcodeName) => {
    config.addPairedNunjucksShortcode(shortcodeName, pairedShortcodes[shortcodeName]);
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
