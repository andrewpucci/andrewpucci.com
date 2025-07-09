import { minify as htmlMinifier } from 'html-minifier-terser';

const minify = async (content) => {
  if (process.env.NODE_ENV !== 'production') {
    return content;
  }
  return await htmlMinifier(content, {
    useShortDoctype: true,
    removeComments: true,
    collapseWhitespace: true,
  });
};

export default minify;
