const { extname } = require('path');

const htmlmin = require('./min-html');
const jsmin = require('./min-js');

module.exports = async (content, outputPath) => {
  if (outputPath) {
    const ext = extname(outputPath);
    switch (ext) {
      case '.html':
        return htmlmin(content, outputPath);
      case '.js':
        return jsmin(content, outputPath);
      default:
        return content;
    }
  }
  return content;
};
