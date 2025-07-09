import pluginRev from 'eleventy-plugin-rev';
import eleventySass from 'eleventy-sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { dateToFormat, obfuscate, stripSpaces, stripProtocol } from './src/utils/filters.js';
import { image, card, expandableImage } from './src/utils/async-shortcodes.js';
import minify from './src/utils/minify.js';

export default function(eleventyConfig) {
  // Add revisioning plugin
  eleventyConfig.addPlugin(pluginRev);
  
  // Configure and add Sass plugin
  eleventyConfig.addPlugin(eleventySass, {
    sass: {
      loadPaths: ["node_modules"],
      style: 'compressed',
      sourceMap: true,
      quietDeps: true // Suppress deprecation warnings
    },
    postcss: postcss([
      autoprefixer(),
      cssnano({ preset: 'default' })
    ]),
    rev: true,
  });

  // Add utility filters
  eleventyConfig.addFilter('dateToFormat', dateToFormat);
  eleventyConfig.addFilter('obfuscate', obfuscate);
  eleventyConfig.addFilter('stripSpaces', stripSpaces);
  eleventyConfig.addFilter('stripProtocol', stripProtocol);

  // Add async shortcodes
  eleventyConfig.addNunjucksAsyncShortcode('image', image);
  eleventyConfig.addNunjucksAsyncShortcode('card', card);
  eleventyConfig.addNunjucksAsyncShortcode('expandableImage', expandableImage);

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
  eleventyConfig.addTransform('minify', minify);

  // Pass some assets right through
  eleventyConfig.addPassthroughCopy('./src/site/assets/files/*');
  eleventyConfig.addPassthroughCopy('./src/site/assets/fonts/*.woff*');
  eleventyConfig.addPassthroughCopy('./src/site/assets/favicon-32x32.png');
  eleventyConfig.addPassthroughCopy('./src/site/humans.txt');
  eleventyConfig.addPassthroughCopy('./src/site/robots.txt');

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
};
