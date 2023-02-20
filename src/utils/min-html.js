const { minify } = require('html-minifier');

module.exports = async (content) => {
  if (process.env.NODE_ENV !== 'production') {
    return content;
  }
  return minify(content, {
    useShortDoctype: true,
    removeComments: true,
    collapseWhitespace: true,
  });
};
