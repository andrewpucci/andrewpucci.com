import { minify as terserMinify } from 'terser';

const minify = async (content) => {
  const minified = await terserMinify(content, {});
  return minified.code;
};

export default minify;
