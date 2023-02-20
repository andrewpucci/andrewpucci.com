const { minify } = require('terser');

module.exports = async (content) => {
  const minified = await minify(content, {});
  return minified.code;
};
